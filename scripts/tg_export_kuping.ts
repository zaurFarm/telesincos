import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore
import { askJSON } from './ai_rotate.mjs';

const CHANNEL = process.env.TG_CHANNEL || 'Talehosmanov';
const LIMIT = parseInt(process.env.TG_LIMIT || '100');
const OUT_DIR = '/var/www/kuping.ru/api/storage/app/public/tg/' + CHANNEL.toLowerCase();
const OUT_JSON = '/root/tg_export.json';
const GROQ_URL = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '') + '/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL_JSON || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

async function parseWithAI(text: string) {
  const r: any = await askJSON(`Разбери описание товара из Telegram-поста продавца обуви и сумок. Определи, обувь это или сумка, мужское, женское или детское. Верни ТОЛЬКО JSON:
{"title":"название для витрины: тип + бренд + материал, например 'Мужские кроссовки Stefano Ricci из натуральной кожи'","category":"ровно одно из: мужская обувь, женская обувь, детская обувь, женские сумки, мужские сумки, аксессуары, другое","brand":"бренд","type":"тип товара (туфли, кроссовки, ботинки, лоферы, шлёпанцы, сандалии, сапоги, сумка, рюкзак, клатч и т.п.)","model":"название модели или линейки, если есть","color":"цвет","material":"материал","season":"сезон, если есть","sizes":[39,40],"price":8500,"sku":"артикул","features":["3-5 коротких характеристик"],"description":"структурированное описание из 3 абзацев: 1) что это и для кого, 2) материалы и качество, 3) комплектация и уход. Без контактов, телефонов и ссылок. Уникальная формулировка, не копия поста"}
Цена числом без точек. Пост:\n${text}`);
  return r?.data || null;
}

function fallbackParse(text: string) {
  const price = /Цена\s*[:：]?\s*([\d.\s]+)/i.exec(text)?.[1]?.replace(/[.\s]/g, '');
  const sku = /Артикул\s*[:：]?\s*([\w-]+)/i.exec(text)?.[1];
  const sizes = /с\s*(\d{2})\s*по\s*(\d{2})/i.exec(text);
  return { price: price ? parseInt(price) : null, sku, sizes: sizes ? Array.from({length: +sizes[2]-+sizes[1]+1}, (_, i) => +sizes[1]+i) : [] };
}

(async () => {
  const client = new TelegramClient(new StringSession(process.env.SESSION!), +process.env.API_ID!, process.env.API_HASH!, { connectionRetries: 3 });
  await client.connect();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const msgs: any[] = [];
  if (LIMIT > 0) { const got = await client.getMessages(CHANNEL, { limit: LIMIT * 12 }); for (const m of got) msgs.push(m); }
  else { for await (const m of client.iterMessages(CHANNEL, {})) { msgs.push(m); if (msgs.length % 5000 === 0) console.log('прочитано сообщений', msgs.length); } }
  const groups = new Map<string, any[]>();
  for (const m of msgs) {
    const key = m.groupedId ? String(m.groupedId) : 'single_' + m.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }
  const out: any[] = []; let n = 0;
  for (const [key, arr] of groups) {
    if (LIMIT > 0 && out.length >= LIMIT) break;
    arr.sort((a, b) => a.id - b.id);
    const text = arr.map((m) => m.message).filter(Boolean).join('\n');
    if (!/Цена|руб|₽|\d{3,}/i.test(text)) continue;
    const fb = fallbackParse(text);
    let ai = await parseWithAI(text);
    if (!ai) ai = {};
    const sku = String(ai.sku || fb.sku || key);
    const photos: string[] = [];
    let i = 0;
    for (const m of arr) {
      if (!m.photo) continue;
      const file = path.join(OUT_DIR, `${sku}_${i++}.jpg`);
      if (!fs.existsSync(file)) {
        const buf = await client.downloadMedia(m, {});
        if (buf) fs.writeFileSync(file, buf as Buffer);
      }
      photos.push(`https://api.kuping.ru/storage/tg/${CHANNEL.toLowerCase()}/${path.basename(file)}`);
    }
    out.push({
      sku, category: ai.category || null, title: ai.title || `${ai.brand || ''} ${ai.type || 'обувь'} арт. ${sku}`.trim(),
      brand: ai.brand || null, type: ai.type || null, material: ai.material || null, model: ai.model || null, color: ai.color || null, season: ai.season || null,
      sizes: ai.sizes?.length ? ai.sizes : fb.sizes, price: ai.price || fb.price,
      features: ai.features || [], description: ai.description || '', photos,
      source_post: `https://t.me/${CHANNEL}/${arr[0].id}`, raw: text,
    });
    n++; if (n % 10 === 0) console.log(`разобрано ${n}`);
  }
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1));
  console.log(`ГОТОВО: ${out.length} товаров, фото в ${OUT_DIR}, json в ${OUT_JSON}`);
  await client.disconnect();
  process.exit(0);
})().catch((e) => { console.error('ОШИБКА', e?.message || e); process.exit(1); });
