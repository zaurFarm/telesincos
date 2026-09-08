import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync('/var/www/telesincos/.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const URL=(env.GROQ_BASE_URL||'https://api.groq.com/openai/v1').replace(/\/$/,'')+'/chat/completions';
const MODEL=env.GROQ_MODEL_JSON||env.GROQ_MODEL||'llama-3.3-70b-versatile';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ask(text){
  const prompt=`Разбери описание товара из Telegram-поста продавца обуви и сумок. Определи, обувь это или сумка, мужское, женское или детское. Верни ТОЛЬКО JSON: {"title":"короткое название для витрины, например 'Женские туфли Prada из натуральной кожи' или 'Женская сумка Chanel'","category":"ровно одно из: мужская обувь, женская обувь, детская обувь, женские сумки, мужские сумки, аксессуары, другое","brand":"бренд","type":"тип товара (туфли, кроссовки, ботинки, сумка, рюкзак, клатч и т.п.)","material":"материал","sizes":[40,41],"price":7500,"sku":"артикул","features":["короткие характеристики"],"description":"2-3 предложения без контактов"}. Цена числом. Пост:\n${text}`;
  for(let a=0;a<4;a++){
    const r=await fetch(URL,{method:'POST',headers:{Authorization:'Bearer '+env.GROQ_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:MODEL,temperature:0,response_format:{type:'json_object'},messages:[{role:'user',content:prompt}]})});
    if(r.status===429){const w=(a+1)*4000;console.log('429, жду',w/1000,'с');await sleep(w);continue;}
    const j=await r.json(); const c=j?.choices?.[0]?.message?.content;
    if(!c){console.log('ответ без content:',JSON.stringify(j).slice(0,160));await sleep(2000);continue;}
    try{return JSON.parse(c);}catch{console.log('битый json');}
  }
  return null;
}
const FILE=process.argv[2]||'/root/tg_export.json';
const d=JSON.parse(fs.readFileSync(FILE,'utf8'));
let fixed=0;
for(const p of d){
  if(!p.title.startsWith('обувь арт') && p.category) continue;
  const ai=await ask(p.raw);
  if(ai?.title){Object.assign(p,{title:ai.title,category:ai.category||p.category,category:ai.category||p.category,brand:ai.brand||p.brand,type:ai.type||p.type,material:ai.material||p.material,sizes:ai.sizes?.length?ai.sizes:p.sizes,price:ai.price||p.price,features:ai.features||[],description:ai.description||''});fixed++;}
  await sleep(1200);
}
fs.writeFileSync(FILE,JSON.stringify(d,null,1));
console.log('исправлено:',fixed,'из',d.filter(p=>p.title.startsWith('обувь арт')).length+fixed);
