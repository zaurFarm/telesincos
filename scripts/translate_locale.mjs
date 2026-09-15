import fs from 'fs';
import { askJSON } from './ai_rotate.mjs';
const [,, FILE, LANG] = process.argv;
if (!FILE || !LANG) { console.error('использование: node translate_locale.mjs <файл.json> <язык: ru|zh|de|...>'); process.exit(1); }
const names = { ru: 'русский', zh: 'китайский (упрощённый)', de: 'немецкий', es: 'испанский', ar: 'арабский', he: 'иврит', en: 'английский' };
const d = JSON.parse(fs.readFileSync(FILE, 'utf8'));
fs.writeFileSync(FILE + '.bak_' + Date.now(), JSON.stringify(d, null, 2));
const isTarget = (v) => LANG === 'ru' ? /[А-Яа-яЁё]/.test(v) : LANG === 'zh' ? /[\u4e00-\u9fff]/.test(v) : LANG === 'ar' ? /[\u0600-\u06FF]/.test(v) : LANG === 'he' ? /[\u0590-\u05FF]/.test(v) : false;
const keys = Object.keys(d).filter(k => typeof d[k] === 'string' && d[k].trim() && /[A-Za-z]{3,}/.test(d[k]) && !isTarget(d[k]));
console.log('к переводу:', keys.length);
let done = 0;
for (let i = 0; i < keys.length; i += 30) {
  const batch = keys.slice(i, i + 30);
  const src = Object.fromEntries(batch.map(k => [k, d[k]]));
  const prompt = `Переведи значения JSON-словаря интерфейса панели управления интернет-магазина на ${names[LANG] || LANG}. Это подписи полей, кнопок, заголовков и подсказок. Правила: коротко, как в настоящих интерфейсах; плейсхолдеры вида {{name}} и {name} оставлять без изменений; названия брендов и технические термины (SKU, API, URL, SEO, Stripe, PayPal, JSON) не переводить; ключи не менять. Верни ТОЛЬКО JSON того же вида {ключ: перевод}.\n${JSON.stringify(src)}`;
  const r = await askJSON(prompt);
  if (r?.data && typeof r.data === 'object') {
    for (const k of batch) { const v = r.data[k]; if (typeof v === 'string' && v.trim()) { d[k] = v; done++; } }
    fs.writeFileSync(FILE, JSON.stringify(d, null, 2) + '\n');
    console.log('прогресс', Math.min(i + 30, keys.length), '/', keys.length, 'переведено', done);
  } else { console.log('пакет', i, 'без ответа, повторю в конце'); keys.push(...batch); if (keys.length > 5000) break; }
}
console.log('ГОТОВО переведено', done);
