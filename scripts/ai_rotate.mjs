import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('/var/www/telesincos/.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const GROQ=(env.GROQ_BASE_URL||'https://api.groq.com/openai/v1').replace(/\/$/,'')+'/chat/completions';
const groqKeys=[...new Set([env.GROQ_API_KEY, ...(env.GROQ_API_KEYS||'').split(',')].map(k=>(k||'').trim()).filter(k=>k.startsWith('gsk_')))];
const groqModels=['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.6-27b','qwen/qwen3.8-27b'];
const GW=env.GROQ_GATEWAY||'';
export const targets=GW?[{name:'gateway/auto',url:GW.replace(/\/$/,'')+'/v1/chat/completions',key:'gateway',model:'auto'},...(env.OPENAI_API_KEY?[{name:'openai/gpt-4o-mini',url:'https://api.openai.com/v1/chat/completions',key:env.OPENAI_API_KEY,model:'gpt-4o-mini'}]:[])]:[
  ...groqModels.flatMap(m=>groqKeys.map((k,i)=>({name:`groq#${i+1}/${m}`, url:GROQ, key:k, model:m}))),
  ...(env.OPENAI_API_KEY?[{name:'openai/gpt-4o-mini', url:'https://api.openai.com/v1/chat/completions', key:env.OPENAI_API_KEY, model:'gpt-4o-mini'}]:[]),
];
const cooldown=new Map(); // name -> timestamp до которого модель не трогаем
export async function askJSON(prompt){
  for (let round=0; round<2; round++){
    for (const t of targets){
      if ((cooldown.get(t.name)||0) > Date.now()) continue;
      try{
        const r=await fetch(t.url,{method:'POST',headers:{Authorization:'Bearer '+t.key,'Content-Type':'application/json'},body:JSON.stringify({model:t.model,temperature:0,response_format:{type:'json_object'},...(/qwen/.test(t.model)?{reasoning_effort:'none'}:{}),messages:[{role:'user',content:prompt}]})});
        if (r.status===429 || r.status===402 || r.status===503){ cooldown.set(t.name, Date.now()+60_000); console.log('лимит',t.name,'→ следующая'); continue; }
        if (!r.ok){ console.log('ошибка',t.name,r.status); cooldown.set(t.name, Date.now()+30_000); continue; }
        const j=await r.json(); const c=j?.choices?.[0]?.message?.content; if(!c) continue;
        try{ return {data:JSON.parse(c), via:t.name}; }catch{ continue; }
      }catch(e){ cooldown.set(t.name, Date.now()+30_000); }
    }
    await new Promise(r=>setTimeout(r,5000));
  }
  return null;
}
