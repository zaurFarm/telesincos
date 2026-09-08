import fs from 'fs';
import { askJSON } from './ai_rotate.mjs';
const FILE=process.argv[2]||'/root/tg_export.json';
const d=JSON.parse(fs.readFileSync(FILE,'utf8'));
const prompt=(text)=>`Разбери описание товара из Telegram-поста продавца обуви и сумок. Определи, обувь это или сумка, мужское, женское или детское. Верни ТОЛЬКО JSON: {"title":"короткое название для витрины, например 'Женские туфли Prada из натуральной кожи' или 'Женская сумка Chanel'","category":"ровно одно из: мужская обувь, женская обувь, детская обувь, женские сумки, мужские сумки, аксессуары, другое","brand":"бренд","type":"тип товара (туфли, кроссовки, ботинки, сумка, рюкзак, клатч и т.п.)","material":"материал","sizes":[40,41],"price":7500,"sku":"артикул","features":["короткие характеристики"],"description":"2-3 предложения без контактов"}. Цена числом. Пост:\n${text}`;
let fixed=0, i=0; const stats={};
for (const p of d){
  i++;
  if (!p.title.startsWith('обувь арт') && p.category) continue;
  const r=await askJSON(prompt(p.raw));
  if (r?.data?.title){ const ai=r.data; Object.assign(p,{title:ai.title,category:ai.category||p.category,brand:ai.brand||p.brand,type:ai.type||p.type,material:ai.material||p.material,sizes:ai.sizes?.length?ai.sizes:p.sizes,price:ai.price||p.price,features:ai.features||[],description:ai.description||''}); fixed++; stats[r.via]=(stats[r.via]||0)+1; }
  if (i%25===0){ fs.writeFileSync(FILE,JSON.stringify(d,null,1)); console.log('прогресс',i,'/',d.length,'исправлено',fixed,JSON.stringify(stats)); }
}
fs.writeFileSync(FILE,JSON.stringify(d,null,1));
console.log('ГОТОВО исправлено:',fixed,'по моделям:',JSON.stringify(stats));
