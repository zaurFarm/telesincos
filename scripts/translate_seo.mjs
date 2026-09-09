import fs from 'fs'; import { askJSON } from './ai_rotate.mjs';
const src=JSON.parse(fs.readFileSync('/var/www/kuping.ru/shop/src/lib/page-seo-ru.json','utf8'));
const langs={en:'английский',de:'немецкий',es:'испанский',ar:'арабский',he:'иврит',zh:'китайский (упрощённый)'};
for (const [code,name] of Object.entries(langs)){
  const path=`/var/www/kuping.ru/shop/public/locales/${code}/common.json`;
  const dict=JSON.parse(fs.readFileSync(path,'utf8')); let n=0;
  for (const [key,[title,desc]] of Object.entries(src)){
    if (dict[`seo-title-${key}`] && dict[`seo-desc-${key}`]) continue;
    const r=await askJSON(`Ты SEO-переводчик маркетплейса Kuping. Переведи на ${name} заголовок и описание страницы для поисковой выдачи. Сохрани смысл, естественную формулировку для носителя, название бренда Kuping не переводи. Заголовок до 60 знаков, описание до 155. Верни ТОЛЬКО JSON {"title":"...","description":"..."}.\nЗаголовок: ${title}\nОписание: ${desc}`);
    if (r?.data?.title){ dict[`seo-title-${key}`]=r.data.title; dict[`seo-desc-${key}`]=r.data.description||''; n++; }
    else console.log('не переведено', code, key);
  }
  fs.writeFileSync(path, JSON.stringify(dict,null,2)); console.log(code,'переведено',n);
}
