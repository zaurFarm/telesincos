/**
 * Comprehensive production health-check for Telesincos.
 * Run:  npm run health
 *
 * Verifies, in order:
 *   1. Env / secrets sanity
 *   2. PostgreSQL connectivity
 *   3. Required tables present
 *   4. Data state (messages, leads, products, competitor prices)
 *   5. Redis connectivity + event-stream consumer group
 *   6. AI provider configured + live test call
 *   7. Market scanner parse logic (offline unit check)
 *   8. Userbot account readiness
 *
 * Exits 0 if no critical failures, 1 otherwise. Warnings never fail the run.
 */
import dotenv from 'dotenv';
import { db } from '../db.js';
import { connection, hasRedisUrl } from '../queue/redis.js';
import { getSettings } from '../system/settings.js';
import { TelegramMarketScanner } from '../engines/market/scanner/TelegramMarketScanner.js';

dotenv.config();

let critical = 0;
let warnings = 0;
const pass = (m: string) => console.log(`  ✅ ${m}`);
const warn = (m: string) => { warnings++; console.warn(`  ⚠️  ${m}`); };
const fail = (m: string) => { critical++; console.error(`  ❌ ${m}`); };
const section = (m: string) => console.log(`\n=== ${m} ===`);

async function run() {
  console.log('🔍 Telesincos Health-Check —', new Date().toISOString());
  console.log('Environment:', process.env.NODE_ENV || 'development');

  // 1. ENV / SECRETS
  section('1. Env & secrets');
  for (const key of ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'ADMIN_TOKEN']) {
    if (process.env[key]) pass(`${key} set`);
    else fail(`${key} missing`);
  }

  // 2. POSTGRES
  section('2. PostgreSQL');
  let dbOk = false;
  try {
    const r = await db.query('SELECT 1 AS ok');
    if (r?.rows?.[0]?.ok === 1) { pass('connection OK'); dbOk = true; }
    else fail('unexpected query result');
  } catch (e: any) { fail(`connection failed: ${e.message}`); }

  // 3. REQUIRED TABLES
  section('3. Required tables');
  const required = [
    'saas_users', 'leads', 'conversations', 'raw_messages', 'account_messages',
    'farm_accounts', 'farm_channels', 'farm_workspaces', 'farm_workspace_settings',
    'products', 'competitor_data', 'pricing_engine_history', 'global_settings',
  ];
  if (dbOk) {
    for (const t of required) {
      try {
        const r = await db.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name=$1) AS e",
          [t]
        );
        if (r.rows[0].e) pass(`table ${t}`);
        else fail(`table ${t} MISSING`);
      } catch (e: any) { fail(`table ${t} check error: ${e.message}`); }
    }
  } else warn('skipped (no DB)');

  // 4. DATA STATE
  section('4. Data state');
  if (dbOk) {
    const counts: Record<string, number> = {};
    for (const t of ['raw_messages', 'account_messages', 'conversations', 'leads', 'products', 'competitor_data', 'farm_accounts']) {
      try {
        const r = ['conversations', 'leads'].includes(t)
          ? await db.withTenant('tenant_1', (client: any) => client.query(`SELECT COUNT(*)::int AS c FROM ${t}`))
          : await db.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
        counts[t] = r.rows[0].c;
      } catch { counts[t] = -1; }
    }
    console.log('  counts:', JSON.stringify(counts));
    if (counts['farm_accounts'] <= 0) warn('no Telegram accounts connected → userbot cannot read messages');
    if (counts['account_messages'] <= 0 && counts['raw_messages'] <= 0) warn('no messages collected yet');
    if (counts['competitor_data'] <= 0) warn('no competitor prices collected yet (scanner has nothing to compare)');
    if (counts['products'] <= 0) warn('no products in catalog yet');
  } else warn('skipped (no DB)');

  // 5. REDIS + STREAM GROUP
  section('5. Redis & event stream');
  if (hasRedisUrl && connection) {
    try {
      const ping = await connection.ping();
      if (ping === 'PONG') pass('Redis PONG'); else fail(`ping returned ${ping}`);
      try {
        const groups: any = await connection.xinfo('GROUPS', 'ai_event_stream');
        if (Array.isArray(groups) && groups.length > 0) pass(`consumer group present (${groups.length})`);
        else warn('stream exists but no consumer group yet');
      } catch (e: any) {
        if (String(e.message).includes('no such key')) warn('ai_event_stream not created yet (created on first event)');
        else warn(`stream check: ${e.message}`);
      }
    } catch (e: any) { fail(`Redis failed: ${e.message}`); }
  } else warn('Redis disabled / REDIS_URL missing');

  // 6. AI PROVIDER + LIVE CALL
  section('6. AI provider');
  const s = getSettings();
  const provider = s.aiProvider || 'openai';
  pass(`provider = ${provider}`);
  if (provider === 'openai') {
    const key = s.openAiKey || process.env.OPENAI_API_KEY || '';
    if (!key || !key.startsWith('sk-')) {
      fail('OPENAI_API_KEY missing or malformed');
    } else {
      pass(`OPENAI_API_KEY set (len ${key.length})`);
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: key });
        const resp = await openai.chat.completions.create({
          model: s.openAiModel || 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'reply with the single word: ok' }],
          max_tokens: 5,
        });
        const txt = resp.choices[0]?.message?.content?.toLowerCase() || '';
        if (txt.includes('ok')) pass('live OpenAI call succeeded');
        else warn(`OpenAI replied unexpectedly: "${txt}"`);
      } catch (e: any) { fail(`live OpenAI call failed: ${e.message}`); }
    }
  } else if (provider === 'gemini') {
    if (process.env.GEMINI_API_KEY) pass('GEMINI_API_KEY set'); else fail('GEMINI_API_KEY missing');
  } else {
    pass(`using ${provider} (no external key check)`);
  }

  // 7. MARKET SCANNER PARSE LOGIC
  section('7. Market scanner parse logic');
  const samples = [
    { text: 'HQD Cuvie оптом 350р от 100шт', wantPrice: 350, wantQty: 100 },
    { text: 'Айфон 15 pro - 65 000 руб', wantPrice: 65000 },
    { text: 'просто болтаем ни о чём', wantPrice: null },
  ];
  for (const smp of samples) {
    const parsed = TelegramMarketScanner.parseMessage(smp.text);
    if (smp.wantPrice === null) {
      if (parsed === null) pass(`correctly ignored non-offer: "${smp.text.slice(0, 30)}"`);
      else warn(`false positive on: "${smp.text}" → ${JSON.stringify(parsed)}`);
    } else {
      if (parsed && parsed.price === smp.wantPrice) {
        const qtyOk = smp.wantQty === undefined || parsed.quantity === smp.wantQty;
        if (qtyOk) pass(`parsed "${smp.text.slice(0, 30)}" → ${parsed.price}₽${parsed.quantity ? ' x' + parsed.quantity : ''}`);
        else warn(`price ok but qty off: ${JSON.stringify(parsed)}`);
      } else {
        fail(`parse failed for "${smp.text}" → ${JSON.stringify(parsed)}`);
      }
    }
  }

  // 8. USERBOT READINESS
  section('8. Userbot account readiness');
  const sess = s.sessionString || process.env.SESSION || '';
  const apiId = s.apiId || process.env.API_ID || '';
  if (apiId) pass('api_id configured'); else warn('api_id not set → cannot log in userbot');
  if (sess && sess.length > 10) pass('session string present'); else warn('no session string → userbot not logged in');

  // SUMMARY
  section('Summary');
  console.log(`  critical failures: ${critical}`);
  console.log(`  warnings:          ${warnings}`);
  if (critical > 0) {
    console.error('\n🔴 HEALTH-CHECK FAILED — fix critical items above.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n🟡 OPERATIONAL with warnings — infra healthy, setup/data steps pending.');
    process.exit(0);
  } else {
    console.log('\n🟢 ALL GREEN — system fully operational.');
    process.exit(0);
  }
}

run().catch(async (e) => {
  console.error('Health-check crashed:', e);
  process.exit(1);
}).finally(async () => {
  try { if (connection) await connection.quit(); } catch {}
  try { await (await import('../db.js')).closeDB?.(); } catch {}
});
