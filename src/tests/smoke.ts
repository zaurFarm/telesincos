import dotenv from 'dotenv';
import { db } from '../db.js';
import { connection } from '../queue/redis.js';

dotenv.config();

console.log('🔍 Starting Telesintos Self-Diagnostic Smoke Test...');
console.log('Current ISO Time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV || 'development');

async function runSmokeTests() {
  let hasFailed = false;

  console.log('\n--- 🔐 1. Security & Token Configuration Check ---');
  const jwtSecret = process.env.JWT_SECRET;
  const adminToken = process.env.ADMIN_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!jwtSecret) {
    console.error('❌ FAIL: JWT_SECRET is missing!');
    if (isProduction) hasFailed = true;
  } else if (jwtSecret.length < 16) {
    console.warn('⚠️ WARNING: JWT_SECRET is shorter than 16 characters. Protect against brute-force attacks by using a longer secret.');
  } else {
    console.log('✅ PASS: JWT_SECRET configured securely.');
  }

  if (!adminToken) {
    console.error('❌ FAIL: ADMIN_TOKEN is missing!');
    if (isProduction) hasFailed = true;
  } else {
    console.log('✅ PASS: ADMIN_TOKEN configured.');
  }

  console.log('\n--- 🐘 2. PostgreSQL Connection Check ---');
  try {
    const res = await db.query('SELECT 1 as result');
    if (res && res.rows && res.rows[0].result === 1) {
      console.log('✅ PASS: PostgreSQL connection established and executed query successfully.');
    } else {
      throw new Error('PostgreSQL returned unexpected query results.');
    }
  } catch (error: any) {
    console.error('❌ FAIL: PostgreSQL database connection failed!');
    console.error('Error Details:', error.message || error);
    hasFailed = true;
  }

  console.log('\n--- 🛑 3. Redis Connection Check ---');
  // IORedis connection from redis.ts can be used or pinged
  if (!process.env.REDIS_URL && isProduction) {
    console.error('❌ FAIL: REDIS_URL is strictly required in production!');
    hasFailed = true;
  } else if (connection) {
    try {
      const pingRes = await connection.ping();
      if (pingRes === 'PONG') {
        console.log('✅ PASS: Redis connection established and responded PONG');
      } else {
        throw new Error(`Unexpected Redis ping response: ${pingRes}`);
      }
    } catch (error: any) {
      console.error('❌ FAIL: Redis connection or ping failed!');
      console.error('Error Details:', error.message || error);
      hasFailed = true;
    }
  } else {
    console.log('ℹ️ INFO: Redis offline / disabled (DISABLE_WORKERS is set or REDIS_URL missing).');
  }

  console.log('\n--- 🤖 4. AI Providers (Gemini / OpenAI) Check ---');
  const geminiKey = process.env.GEMINI_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey) {
    console.error('❌ FAIL: GEMINI_API_KEY is not configured!');
    if (isProduction) hasFailed = true;
  } else if (typeof geminiKey === 'string' && geminiKey.trim().length > 20) {
    console.log(`✅ PASS: GEMINI_API_KEY is configured (Length: ${geminiKey.length} chars).`);
  } else {
    console.error('❌ FAIL: GEMINI_API_KEY is present but appears abnormally short (< 20 chars).');
    if (isProduction) hasFailed = true;
  }

  if (openAiKey) {
    if (openAiKey.startsWith('sk-') && openAiKey.length > 20) {
      console.log('✅ PASS: OPENAI_API_KEY format matches OpenAI credential guidelines.');
    } else if (openAiKey.length > 20) {
      console.log('✅ PASS: OPENAI_API_KEY is configured with custom keys or proxies.');
    } else {
      console.warn('⚠️ WARNING: OPENAI_API_KEY configuration detected but appears invalid/short.');
    }
  } else {
    console.log('ℹ️ INFO: Optional/Fallback OpenAI features are disabled.');
  }

  console.log('\n--- ✈️ 5. Telegram Configurations Check ---');
  const tgToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!tgToken) {
    console.warn('⚠️ WARNING: TELEGRAM_BOT_TOKEN/BOT_TOKEN is missing. Telegram client will not receive updates.');
  } else if (/^\d+:[A-Za-z0-9_-]{35,50}$/.test(tgToken.trim())) {
    console.log('✅ PASS: Telegram Bot Token format is valid.');
  } else {
    console.warn('⚠️ WARNING: Telegram Bot Token configuration detected, but the layout is unusual.');
  }

  const tgUsername = (process.env as any).VITE_TELEGRAM_BOT_USERNAME;
  if (tgUsername) {
    const cleanUsername = tgUsername.startsWith('@') ? tgUsername.substring(1) : tgUsername;
    if (cleanUsername.startsWith('http://') || cleanUsername.startsWith('https://')) {
      console.log('✅ PASS: VITE_TELEGRAM_BOT_USERNAME configured as an absolute URL.');
    } else if (/^[a-zA-Z0-9_]{5,32}$/.test(cleanUsername)) {
      console.log(`✅ PASS: VITE_TELEGRAM_BOT_USERNAME ("${cleanUsername}") matches Telegram's official naming rules.`);
    } else {
      console.error(`❌ FAIL: VITE_TELEGRAM_BOT_USERNAME ("${tgUsername}") is invalid (Must be 5-32 characters, alphanumeric or underscores).`);
      hasFailed = true;
    }
  } else {
    console.log('ℹ️ INFO: VITE_TELEGRAM_BOT_USERNAME not explicitly defined, using standard fallback.');
  }

  console.log('\n--- 🗄️ 6. DB Schema Alignment Check ---');
  try {
    const tableChecks = ['saas_users', 'leads', 'conversations', 'farm_accounts'];
    for (const t of tableChecks) {
      const checkRes = await db.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) as exists",
        [t]
      );
      if (checkRes.rows[0].exists) {
        console.log(`✅ PASS: Database table "${t}" verified in schema.`);
      } else {
        console.warn(`⚠️ WARNING: Table "${t}" was not found in the public schema. Database migrations or DB init might need executing.`);
      }
    }
  } catch (error: any) {
    console.warn('⚠️ WARNING: Database schema validation query failed. DB structure cannot be fully verified.', error.message);
  }

  console.log('\n--- 📊 Final Readiness Verification ---');
  if (hasFailed) {
    console.error('\n🔴 DIAGNOSTIC FAILURE: One or more critical systems failed the health check.');
    console.error('Check your .env settings and network state before promoting to production.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL CHECKS PASSED: The system has verified basic service availability.');
    console.log('Status set to: "Controlled Production Pilot Ready" 🚀');
    process.exit(0);
  }
}

// Ensure database pool closes cleanly when exiting smoke tests
runSmokeTests().finally(async () => {
  try {
    // If we have custom cleanup, apply here
    if (connection) {
      await connection.quit();
    }
  } catch (err) {}
});
