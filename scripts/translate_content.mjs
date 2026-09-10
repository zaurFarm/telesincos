import fs from 'fs'; import { execSync } from 'child_process'; import { askJSON } from './ai_rotate.mjs';
const langs={en:'английский',de:'немецкий',es:'испанский',ar:'арабский',he:'иврит',zh:'китайский (упрощённый)'};
const entity=process.argv[2]; const sqlList=process.argv[3]; const limit=parseInt(process.argv[4]||'100000');
const q=(sql)=>execSync(`mysql --no-defaults -u root --raw -N kuping -e ${JSON.stringify(sql)}`,{maxBuffer:1<<26}).toString().trim().split('\n').filter(Boolean).map(l=>l.split('\t'));
const rows=q(sqlList).slice(0,limit);
const done=new Set(q(`select concat(entity_id,':',lang) from content_translations where entity='${entity}' and field='name'`).map(r=>r[0]));
let n=0, miss=0;
for (const [id,name,ctx] of rows){
  const todo=Object.keys(langs).filter(l=>!done.has(`${id}:${l}`));
  if (!todo.length) continue;
  const r=await askJSON(`Ты переводчик каталога маркетплейса. Переведи название категории товаров «${name}» (контекст: ${ctx||'каталог'}) на языки: ${todo.map(l=>langs[l]).join(', ')}. Естественно для носителя, коротко, как в меню магазина. Бренды не переводи. Верни ТОЛЬКО JSON вида {"en":"...","de":"..."} с кодами языков ${JSON.stringify(todo)}.`);
  if (!r?.data){ miss++; continue; }
  const esc=(v)=>String(v).replace(/\\/g,'\\\\').replace(/'/g,"''").replace(/\r?\n/g,' ');
  const vals=todo.map(l=>{const t=esc((r.data[l]||'').toString().slice(0,190)); return t?`('${entity}',${parseInt(id)},'${l}','name','${t}')`:null;}).filter(Boolean);
  if (vals.length){ fs.writeFileSync('/tmp/ct_ins.sql', `insert into content_translations (entity,entity_id,lang,field,text) values ${vals.join(',')} on duplicate key update text=values(text);`); try{ execSync('mysql --no-defaults -u root kuping < /tmp/ct_ins.sql'); }catch(e){ console.log('sql error id',id, String(e.stderr||e.message).slice(0,120)); } }
  n++; if (n%50===0) console.log('переведено',n,'из',rows.length);
}
console.log('ГОТОВО', entity, 'переведено', n, 'ошибок', miss);
