import fs from 'fs';
import { askJSON } from './ai_rotate.mjs';
const FILE=process.argv[2]||'/root/tg_export.json';
const d=JSON.parse(fs.readFileSync(FILE,'utf8'));
const prompt=(text)=>`Разбери описание товара из Telegram-поста продавца обуви и сумок. Определи, обувь это или сумка, мужское, женское или детское. Верни ТОЛЬКО JSON: {"title":"название для витрины: тип + бренд + материал, например 'Мужские кроссовки Stefano Ricci из натуральной кожи'","category":"ровно одно из: мужская обувь, женская обувь, детская обувь, женские сумки, мужские сумки, аксессуары, другое","brand":"бренд","type":"тип товара (туфли, кроссовки, ботинки, лоферы, шлёпанцы, сандалии, сапоги, сумка, рюкзак, клатч и т.п.)","model":"название модели или линейки, если есть","color":"цвет","material":"материал","season":"сезон, если есть","sizes":[39,40],"price":8500,"sku":"артикул","features":["3-5 коротких характеристик"],"description":"структурированное описание из 3 абзацев: 1) что это и для кого, 2) материалы и качество, 3) комплектация и уход. Без контактов, телефонов и ссылок. Уникальная формулировка, не копия поста"}. Цена числом. Пост:\n${text}`;
let fixed=0, i=0; const stats={};
for (const p of d){
  i++;
  if (!/арт\./.test(p.title||'') && p.description && p.category && ('color' in p)) continue;
  const r=await askJSON(prompt(p.raw));
  if (r?.data?.title){ const ai=r.data; Object.assign(p,{title:ai.title,category:ai.category||p.category,brand:ai.brand||p.brand,type:ai.type||p.type,material:ai.material||p.material,sizes:ai.sizes?.length?ai.sizes:p.sizes,price:ai.price||p.price,features:ai.features||[],description:ai.description||'',model:ai.model||null,color:ai.color||null,season:ai.season||null}); fixed++; stats[r.via]=(stats[r.via]||0)+1; }
  if (i%25===0){ fs.writeFileSync(FILE,JSON.stringify(d,null,1)); console.log('прогресс',i,'/',d.length,'исправлено',fixed,JSON.stringify(stats)); }
}
fs.writeFileSync(FILE,JSON.stringify(d,null,1));
console.log('ГОТОВО исправлено:',fixed,'по моделям:',JSON.stringify(stats));
