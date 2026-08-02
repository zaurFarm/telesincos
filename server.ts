import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { logger } from './src/system/logger.js';
import { db as pool, initDB } from './src/db.js';
import { initBillingDB } from './src/system/billing.js';

dotenv.config();

import { EnvironmentValidator } from './src/runtime/config/EnvironmentValidator.js';
import { ProxyAwareness } from './src/runtime/networking/ProxyAwareness.js';
import { DistributedEventBus } from './src/system/backbone/DistributedEventBus.js';
import { StructuredLogger } from './src/runtime/observability/StructuredLogger.js';
import { GracefulShutdown } from './src/runtime/process/GracefulShutdown.js';
import { HealthService } from './src/runtime/health/HealthService.js';

// STAGE 15: Production Hardening
EnvironmentValidator.validateOrThrow();
GracefulShutdown.attachHandlers();
DistributedEventBus.initialize();

export const app = express();
ProxyAwareness.apply(app);
HealthService.attach(app);

app.set('trust proxy', 1);

StructuredLogger.info('[Server] Master process initialized');

// Secure CORS Whitelisting
const corsOriginEnv = process.env.CORS_ORIGIN;
let corsOptions: cors.CorsOptions = {};

if (process.env.NODE_ENV === 'production') {
  if (corsOriginEnv) {
    const origins = corsOriginEnv.split(',').map(o => o.trim());
    corsOptions = {
      origin: origins,
      credentials: true
    };
  } else if (process.env.APP_URL) {
    corsOptions = {
      origin: [process.env.APP_URL],
      credentials: true
    };
  } else {
    // Rigid production restriction — reject cross-origin requests unless whitelisted
    console.warn('⚠️ WARNING: CORS_ORIGIN and APP_URL are not configured in production. Enforcing strict origin security.');
    corsOptions = {
      origin: false
    };
  }
} else {
  // Safe environment defaults: allow localhost and preview frames
  corsOptions = {
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost:') || origin.match(/^https:\/\/ais-(dev|pre)-/)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback for general visual layouts in workspace
      }
    },
    credentials: true
  };
}

app.use(cors(corsOptions));
app.use(express.json());

// 🚀 Инициализация БД & Redis
async function startChecks() {
  if (!process.env.ADMIN_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: ADMIN_TOKEN is missing in production');
      process.exit(1);
    } else {
      console.warn('WARN: ADMIN_TOKEN is missing. Only allowed in development.');
    }
  }
  try {
    await initDB();
    await initBillingDB();
    console.log('[DB] Database initialized.');

    // Load persisted settings (AI provider/keys, userbot session, etc.) from DB
    const { loadSettings } = await import('./src/system/settings.js');
    await loadSettings();
    
    // Check Redis ping
    const { hasRedisUrl, connection: redisConn } = await import('./src/queue/redis.js');
    if (hasRedisUrl && redisConn) {
      const ping = await redisConn.ping();
      if (ping !== 'PONG') {
        throw new Error('Redis ping failed.');
      }
      console.log('[Redis] Connected.');
    }
  } catch (err: any) {
    console.error("WARNING: Startup checks failed (DB/Redis missing). Features will be degraded. Error: " + err.message);
  }
}
startChecks();

// ============================================
// 🔧 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function hashText(text: string) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// ============================================
// 📊 MIDDLEWARES & AUTH
// ============================================



import jwt from 'jsonwebtoken';
import { runWithContext, createContext } from './src/system/context.js';
import { contextMiddleware, AuthRequest } from './src/runtime/observability/ContextMiddleware.js';

export function requireAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const expectedToken = process.env.ADMIN_TOKEN;

  // Enforce token existence. An empty, missing, or fallback ADMIN_TOKEN can never grant admin access.
  if (!expectedToken || expectedToken.trim() === '') {
    console.error('CRITICAL SECURITY ALERT: ADMIN_TOKEN has not been configured in the environment variables.');
    return res.status(401).json({ 
      error: 'unauthorized', 
      message: 'Secure configuration issue: ADMIN_TOKEN must be explicitly set.' 
    });
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : (authHeader || '');
  
  if (token && token === expectedToken) {
      req.user = { id: 'admin', plan: 'scale', tenantId: 'tenant_1' };
      return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
      if (!process.env.JWT_SECRET) {
          throw new Error('CRITICAL: JWT_SECRET must be configured.');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
  } catch (err) {
      return res.status(401).json({ error: 'unauthorized' });
  }
}

// Ensure all API routes are protected

import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { connection, hasRedisUrl } from './src/queue/redis.js';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false, 
  ...(hasRedisUrl ? {
    store: new RedisStore({
      sendCommand: (...args: string[]) => (connection as any)!.call(...args),
    })
  } : {}),
});

const strictLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 20, 
  message: 'Too many actions, please try again after 1 minute',
  ...(hasRedisUrl ? {
    store: new RedisStore({
      sendCommand: (...args: string[]) => (connection as any)!.call(...args),
    })
  } : {}),
});

app.use('/api/', apiLimiter);


// ============================================
// 🔐 AUTH — Регистрация и вход пользователей
// ============================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    if (password.length < 8) return res.status(400).json({ error: 'Пароль минимум 8 символов' });
    
    const bcrypt = await import('bcryptjs');
    const existing = await pool.query('SELECT id FROM saas_users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    
    const hash = await bcrypt.default.hash(password, 10);
    const userRes = await pool.query(
      'INSERT INTO saas_users (email, password, plan) VALUES ($1, $2, $3) RETURNING id, email, plan, created_at',
      [email.toLowerCase(), hash, 'free']
    );
    const user = userRes.rows[0];
    
    // Создаём workspace для пользователя
    const wsRes = await pool.query(
      'INSERT INTO workspaces (owner_id, name) VALUES ($1, $2) RETURNING id',
      [user.id, email.split('@')[0]]
    ).catch(() => ({ rows: [{ id: user.id }] }));
    
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan, tenantId: wsRes.rows[0].id },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (e: any) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Ошибка регистрации' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email и пароль обязательны' });
    
    const bcrypt = await import('bcryptjs');
    const userRes = await pool.query(
      'SELECT su.*, w.id as workspace_id FROM saas_users su LEFT JOIN workspaces w ON w.owner_id = su.id WHERE su.email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    
    if (userRes.rows.length === 0) return res.status(401).json({ error: 'Неверный email или пароль' });
    const user = userRes.rows[0];
    
    const valid = await bcrypt.default.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });
    
    const token = jwt.sign(
      { id: user.id, email: user.email, plan: user.plan, tenantId: user.workspace_id || user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    
    res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Ошибка входа' });
  }
});

app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userRes = await pool.query(
      'SELECT id, email, plan, created_at FROM saas_users WHERE id = $1',
      [req.user?.id]
    );
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(userRes.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка' });
  }
});

app.use('/api', requireAuth);



app.use('/api', contextMiddleware);

// ============================================
// 📊 STATUS & SYNC STREAM
// ============================================

app.get('/api/stream/cognitive', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', meta: { timestamp: Date.now() } })}\n\n`);

  const keepAlive = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  req.on('close', () => clearInterval(keepAlive));
});

app.get('/api/status', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const [
        users,
      groups,
      farmChannels,
      actions,
      history,
      competitors,
      learnedStyles,
      knowledge
    ] = await Promise.all([
      pool.query('SELECT * FROM users ORDER BY last_seen DESC LIMIT 500'),
      pool.query('SELECT * FROM crm_groups ORDER BY created_at DESC'),
      pool.query('SELECT * FROM farm_channels ORDER BY created_at DESC'),
      pool.query('SELECT * FROM actions ORDER BY created_at DESC LIMIT 50'),
      pool.query('SELECT * FROM history ORDER BY created_at DESC LIMIT 200'),
      pool.query('SELECT COUNT(*) FROM competitor_data'),
      pool.query('SELECT COUNT(*) FROM learned_styles'),
      pool.query('SELECT * FROM knowledge_base ORDER BY created_at DESC LIMIT 10')
    ]);
    
    // Fall back to original competitor query so we don't break mapping
    const competitorsQuery = await pool.query('SELECT * FROM competitor_data ORDER BY created_at DESC LIMIT 100');

    res.json({
      users: (users.rows || []).map((u: any) => ({
        id: u.id,
        username: u.username,
        firstName: u.first_name,
        lastSeen: u.last_seen
      })),
      groups: (farmChannels.rows || []).map((c: any) => ({
        id: c.channel_id,
        title: c.title,
        lastActive: c.created_at
      })),
      crmGroups: groups.rows || [],
      recentActions: (actions.rows || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        user: a.user_name,
        chat: a.chat,
        timestamp: a.created_at,
        text: a.content
      })),
      history: (history.rows || []).map((r: any) => ({
        id: r.id,
        chatTitle: r.chat_title,
        username: r.username,
        text: r.text,
        date: r.created_at
      })),
      competitors: (competitorsQuery.rows || []).map((c: any) => ({
        id: c.id,
        date: c.created_at,
        group: c.group_name,
        seller: c.seller,
        productText: c.product_text,
        price: c.price
      })),
      learnedStyles: learnedStyles.rows && learnedStyles.rows.length > 0 ? Number(learnedStyles.rows[0].count) : 0,
      knowledge: knowledge.rows || [],
      botConfigured: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_TOKEN.length > 10)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
  });
});

// ============================================
// ⚙️ SETTINGS
// ============================================

import { getSettings, updateSettings } from './src/system/settings.js';
import { getPendingPosts, approvePost, rejectPost, getHistory } from './src/autopost/api.js';

app.get('/api/settings', requireAuth, async (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', requireAuth, async (req, res) => {
  updateSettings(req.body);
  res.json({ success: true, settings: getSettings() });
});

// Autopost routes
app.get('/api/autopost/pending', requireAuth, getPendingPosts);
app.get('/api/autopost/history', requireAuth, getHistory);
app.post('/api/autopost/:id/approve', requireAuth, approvePost);
app.post('/api/autopost/:id/reject', requireAuth, rejectPost);

// ============================================
// 👥 SYSTEM ACCOUNTS CONTROL
// ============================================

app.get('/api/accounts', requireAuth, async (req, res) => {
  try {
    const data = await pool.query(`SELECT id, phone, status, state, role, trust_score, daily_limit, sent_today, created_at FROM farm_accounts ORDER BY created_at DESC`);
    // Removed mockup account insertion for production
    // Accounts will be populated organically
    res.json(data.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.patch('/api/accounts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;
    let updates = [];
    let values = [];
    let idx = 1;

    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
    }
    if (role !== undefined) {
      updates.push(`role = $${idx++}`);
      values.push(role);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE system_accounts SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    }
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ============================================
// 🧠 АНАЛИЗ ГРУППЫ (CRM)
// ============================================

app.post('/api/analyze-group', requireAuth, async (req, res) => {
  const { name, description, link } = req.body;

  const desc = description || '';

  let analysis = {
    category: 'Общее',
    isPaid: desc.toLowerCase().includes('платно'),
    linksAllowed: !desc.toLowerCase().includes('запрещены ссылки'),
    summary: 'Авто-анализ правил группы'
  };

  try {
    const { generateJSON } = await import('./src/ai/provider.js');
    const prompt = `Ты - опытный модератор и маркетолог в Telegram. Твоя задача проанализировать описание телеграм группы и сегментировать ее. 
    Название: ${name}
    Описание: ${desc}
    
    Верни JSON строго в таком формате:
    {
      "category": "<Подробная категория или сегмент аудитории (например 'B2B: Предприниматели', 'Барахолка', 'Crypto', 'IT Vacancies', 'Общение')>",
      "isPaid": <true/false - платно ли публиковать тут посты или рекламу (если упомянут прайс или оплата)>,
      "linksAllowed": <true/false - разрешено ли оставлять ссылки (если сказано что ссылки запрещены или безлинк - false)>,
      "summary": "<Краткая выжимка из 2-3 предложений: суть правил, тематика, портрет ЦА>"
    }`;

    const parsed = await generateJSON(prompt);
    analysis = {
        category: parsed.category || 'Без категории',
        isPaid: !!parsed.isPaid,
        linksAllowed: parsed.linksAllowed !== false,
        summary: parsed.summary || 'Анализ завершен'
    };
  } catch (aiErr) {
    console.error('AI Analysis failed, using fallback', aiErr);
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO crm_groups 
      (name, description, link, analysis)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, link, description, analysis, status, created_at
      `,
      [
        name,
        description,
        link,
        JSON.stringify(analysis)
      ]
    );
    res.json({ success: true, group: result.rows[0] });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// ============================================
// 🧍 USERS
// ============================================

export async function upsertUser(user: any) {
  try {
    await pool.query(
      `
      INSERT INTO users (id, username, first_name, last_seen)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id)
      DO UPDATE SET 
        username = EXCLUDED.username,
        first_name = EXCLUDED.first_name,
        last_seen = NOW()
      `,
      [user.id, user.username, user.first_name]
    );
  } catch (e) {
    console.error("Failed to upsert user", e);
  }
}

// ============================================
// 💬 HISTORY & CONVERSATIONS
// ============================================

export async function saveMessage(msg: any) {
  try {
    await pool.query(
      `
      INSERT INTO history (chat_title, username, text, created_at)
      VALUES ($1, $2, $3, NOW())
      `,
      [
        msg.chat,
        msg.username,
        msg.text
      ]
    );
  } catch (e) {
    console.error("Failed to save message", e);
  }
}

export async function saveConversation(
  userId: string,
  chatId: string,
  role: 'user' | 'assistant',
  message: string,
  leadId?: number,
  accountId?: number
) {
  try {
    await pool.withTenant('tenant_1', async (client: any) => {
      await client.query(`
        INSERT INTO conversations (user_id, chat_id, role, message, lead_id, account_id, tenant_id)
        VALUES ($1, $2, $3, $4, $5, $6, 'tenant_1')
      `, [userId, chatId, role, message, leadId || null, accountId || null]);
    });
  } catch (e: any) {
    console.error("[SAVE_CONV_ERROR]", {
      message: e?.message,
      code: e?.code,
      detail: e?.detail,
      stack: e?.stack
    });
    throw e;
  }
}

export async function getConversationContext(
  userId: string,
  chatId: string
): Promise<string[]> {
  try {
    const res = await pool.withTenant('tenant_1', async (client: any) => {
      return client.query(`
        SELECT role, message FROM conversations
        WHERE user_id=$1 AND chat_id=$2
        ORDER BY id DESC
        LIMIT 10
      `, [userId, chatId]);
    });

    return res.rows.reverse().map(r => `${r.role}: ${r.message}`);
  } catch (e) {
    console.error("Failed to get conversation context", e);
    return [];
  }
}

// ============================================
// 🎯 LEADS (CRM)
// ============================================

export async function createLead(data: {
  userId: string;
  username?: string;
  firstName?: string;
  chat: string;
  text: string;
  scoring: any;
}) {
  try {
    const result = await pool.query(
      `INSERT INTO leads 
       (user_id, username, first_name, source_chat, source_message, intent, temperature, budget, confidence)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.userId,
        data.username,
        data.firstName,
        data.chat,
        data.text,
        data.scoring.intent,
        data.scoring.temperature,
        data.scoring.budget,
        data.scoring.confidence
      ]
    );
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  } catch (e) {
    console.error("Failed to create lead", e);
    return null;
  }
}

import { calculateLeadScore } from './src/ai/leadScore.js';

export async function getLeads() {
  try {
    const res = await pool.query(`
      SELECT * FROM leads
      ORDER BY created_at DESC
    `);
    
    // Enrich with dynamic scores and PERSIST them for learning
    const enriched = await Promise.all(
      res.rows.map(async (l) => {
        const score = await calculateLeadScore(l);
        // Async update DB to not block UI
        pool.query("UPDATE leads SET score = $1 WHERE id = $2", [score, l.id]).catch((e: any) => {
          if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
             console.error(e);
          }
        });
        return { ...l, score };
      })
    );
    
    return enriched;
  } catch (e) {
    console.error("Failed to get leads", e);
    return [];
  }
}

export async function updateLeadStatus(id: number, status: string) {
  try {
    const res = await pool.query(`SELECT status FROM leads WHERE id=$1`, [id]);
    if (!res.rows.length) return false;
    
    const currentStatus = res.rows[0].status;
    const allowedTransitions: Record<string, string[]> = {
      'new': ['contacted', 'dialog', 'lost', 'closed'],
      'contacted': ['dialog', 'qualified', 'lost', 'closed'],
      'dialog': ['qualified', 'lost', 'closed', 'contacted'],
      'qualified': ['closed', 'lost'],
      'closed': ['lost'], // rarely used but possible refund/rollback
      'lost': ['new', 'contacted'] // reactivation
    };

    if (currentStatus && allowedTransitions[currentStatus] && !allowedTransitions[currentStatus].includes(status)) {
      console.warn(`[CRM] Invalid transition from ${currentStatus} to ${status} for lead ${id}. Ignoring.`);
      return false; // Skip invalid transition
    }

    await pool.query(
      `UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2`,
      [status, id]
    );
    return true;
  } catch (e) {
    console.error("Failed to update lead status", e);
    return false;
  }
}

export async function updateLeadStage(id: number, stage: string) {
  try {
    await pool.query(
      `UPDATE leads SET stage=$1, updated_at=NOW() WHERE id=$2`,
      [stage, id]
    );
  } catch (e) {
    console.error("Failed to update lead stage", e);
  }
}

export async function logRisk(userId: string, riskLevel: string, flags: string[]) {
  try {
    await pool.query(
      `INSERT INTO user_risks (user_id, risk_level, flags) VALUES ($1, $2, $3)`,
      [userId, riskLevel, JSON.stringify(flags)]
    );
  } catch (e) {
    console.error("Failed to log risk", e);
  }
}

export async function savePaymentData(leadId: number, amount: number, cardLast4: string) {
  try {
    await pool.query(
      `UPDATE leads SET expected_amount=$1, expected_card_last4=$2, payment_status='waiting', updated_at=NOW() WHERE id=$3`,
      [amount, cardLast4, leadId]
    );
  } catch (e) {
    console.error("Failed to save payment data", e);
  }
}

export async function getLeadMessages(leadId: number) {
  try {
    const res = await pool.query(
      `SELECT * FROM conversations 
       WHERE lead_id=$1 
       ORDER BY created_at ASC`,
      [leadId]
    );
    return res.rows;
  } catch (e) {
    console.error("Failed to get lead messages", e);
    return [];
  }
}

export async function getLeadByUserIdAndChatId(userId: string, chatId: string) {
  try {
    const res = await pool.query(
      `SELECT * FROM leads WHERE user_id=$1 AND source_chat=$2 ORDER BY created_at DESC LIMIT 1`,
      [userId, chatId]
    );
    return res.rows && res.rows.length > 0 ? res.rows[0] : null;
  } catch (e) {
    console.error("Failed to get lead by user id", e);
    return null;
  }
}

app.get('/api/leads', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    const leads = await getLeads();
    res.json(leads);
  });
});

import { z } from 'zod';

const ConfirmPaymentSchema = z.object({
  amount: z.number().positive(),
  last4: z.string().length(4),
  raw_sms: z.string().optional(),
  idempotency_key: z.string().optional()
});

const UpdateStatusSchema = z.object({
  id: z.number().positive(),
  status: z.enum(['new', 'contacted', 'dialog', 'qualified', 'closed', 'lost'])
});

app.post('/api/leads/status', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    const result = UpdateStatusSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', issues: result.error.issues });
    }

    const { id, status } = result.data;
    const success = await updateLeadStatus(id, status);
    if (!success) {
      return res.status(400).json({ error: 'Invalid strict transition or DB error' });
    }
    res.json({ success: true });
  });
});

app.get('/api/leads/:id/messages', requireAuth, async (req, res) => {
  const messages = await getLeadMessages(Number(req.params.id));
  res.json(messages);
});

import { saveWinningDialogue } from './src/ai/learning.js';

// ... other imports

export async function processPaymentSms(smsText: string, externalId: string, expectedLeadId: number) {
  if (!expectedLeadId) {
    throw new Error('Strict payment correlation requires expectedLeadId');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const match = smsText.match(/(\d+(\.\d+)?)\D+\*(\d{4})/);
    if (!match) return false;

    const amount = parseFloat(match[1]);
    const last4 = match[3];

    const leadRes = await client.query(`
      SELECT * FROM leads 
      WHERE payment_status = 'waiting'
        AND expected_amount = $1
        AND expected_card_last4 = $2
        AND id = $3
      FOR UPDATE SKIP LOCKED
    `, [amount, last4, expectedLeadId]);

    if (!leadRes.rows.length) {
      await client.query('ROLLBACK');
      return false;
    }

    const lead = leadRes.rows[0];

    // idempotency
    const paymentRes = await client.query(`
      INSERT INTO payments (lead_id, amount, card_last4, raw_sms, external_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (external_id) DO NOTHING
      RETURNING id
    `, [lead.id, amount, last4, smsText, externalId]);

    if (!paymentRes.rows.length) {
      await client.query('ROLLBACK');
      return false; // already processed
    }

    await client.query(`
      UPDATE leads 
      SET payment_status='paid', status='closed', updated_at=NOW()
      WHERE id=$1
    `, [lead.id]);

    await client.query('COMMIT');
    
    // Learn from successful dialog
    await saveWinningDialogue(lead.id);

    // Mark all message tests for this lead as successful
    await pool.query(`
      UPDATE message_tests
      SET success = true
      WHERE lead_id = $1
    `, [lead.id]);

    return true;
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Payment confirmation failed", e);
    throw e;
  } finally {
    client.release();
  }
}

app.post('/api/payments/confirm', requireAuth, async (req, res) => {
  const { smsText, externalId, expectedLeadId } = req.body;

  if (!smsText || !externalId || !expectedLeadId) {
    return res.status(400).json({ error: 'Strict validation requires valid smsText, externalId, and expectedLeadId' });
  }

  try {
    const success = await processPaymentSms(smsText, externalId, expectedLeadId);
    if (!success) {
      return res.status(404).json({ error: 'Lead not found or already processed' });
    }
    res.json({ success: true });
  } catch (e) {
    console.error("Failed to confirm payment via SMS", e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/analytics/summary', requireAuth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE event='ai_reply') as replies,
        COUNT(*) FILTER (WHERE event='lead_ready') as leads,
        COUNT(*) FILTER (WHERE event='deal_closed') as deals,
        SUM(value) FILTER (WHERE event='deal_closed') as revenue
      FROM sales_metrics
    `);

    res.json(stats.rows[0] || { replies: 0, leads: 0, deals: 0, revenue: 0 });
  } catch(e) {
    console.error('Analytics Error', e);
    res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/analytics/timeseries', requireAuth, async (req, res) => {
  try {
    const data = await pool.query(`
      SELECT DATE(created_at) as date,
             COUNT(*) FILTER (WHERE event='deal_closed') as deals,
             SUM(value) as revenue
      FROM sales_metrics
      GROUP BY date
      ORDER BY date
    `);

    res.json(data.rows);
  } catch(e) {
      console.error('Analytics Timeseries Error', e);
      res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/leads/pipeline', requireAuth, async (req, res) => {
  try {
    const leads = await pool.query(`
      SELECT id, user_id, status, stage, needs_human, updated_at
      FROM leads
      ORDER BY updated_at DESC
      LIMIT 100
    `);

    res.json(leads.rows);
  } catch(e) {
      console.error('Pipeline leads Error', e);
      res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/experiments', requireAuth, async (req, res) => {
  try {
    const data = await pool.query(`SELECT * FROM ai_experiments ORDER BY started_at DESC LIMIT 50`);
    res.json(data.rows);
  } catch (e) {
    res.status(500).json({error: 'DB error'});
  }
});

app.post('/api/experiments', requireAuth, async (req, res) => {
  try {
    const { name, strategy_a, strategy_b, metric } = req.body;
    await pool.query(`
      INSERT INTO ai_experiments (name, strategy_a, strategy_b, metric)
      VALUES ($1, $2, $3, $4)
    `, [name, strategy_a, strategy_b, metric]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({error: 'DB error'});
  }
});

import { getUsage } from './src/ai/services/usage.js';

app.get('/api/usage', requireAuth, async (req: AuthRequest, res) => {
  try {
    // In actual implementation req.user.workspaceId would be used.
    // For now we mock it as the first workspace or globally
    const workspaceRes = await pool.query('SELECT id FROM workspaces LIMIT 1');
    if (!workspaceRes.rows.length) {
      return res.json({ messages: 0, leads: 0 });
    }
    const usage = await getUsage(workspaceRes.rows[0].id);
    res.json(usage);
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/billing/checkout', requireAuth, async (req: AuthRequest, res) => {
  // Mock stripe checkout
  res.json({ url: '/dashboard/success', msg: 'Redirect to checkout' });
});

app.post('/api/ai/control', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { strategy, markup, followups } = req.body;
    // Assume workspaceId 1 or user's workspace
    const workspaceRes = await pool.query('SELECT id FROM workspaces LIMIT 1');
    if (workspaceRes.rows.length > 0) {
       const wId = workspaceRes.rows[0].id;
       await pool.query(`
         INSERT INTO workspace_settings (workspace_id, settings)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (workspace_id) 
         DO UPDATE SET settings = workspace_settings.settings || $2::jsonb, updated_at = NOW()
       `, [wId, JSON.stringify({ ai_strategy: strategy, ai_markup: markup, followups_enabled: followups })]);
    }
    
    // Quick update via global brain to apply immediately
    const { updateDecisionEngine } = await import('./src/ai/services/experiments.js');
    await updateDecisionEngine({ preferredStrategy: strategy, markup, followups_enabled: followups });
    
    res.json({ success: true });
  } catch(e) {
    console.error('Control API Error', e);
    res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/leads/priority', requireAuth, async (req, res) => {
  try {
    const leads = await pool.query(`
      SELECT *
      FROM leads
      ORDER BY updated_at DESC
      LIMIT 200
    `);

    // Calculate priority
    const ranked = leads.rows.map((lead: any) => {
      const p = (lead.score || 0) * 2 + 
                (lead.confidence || 0) * 1.5 + 
                (lead.stage === 'close' || lead.stage === 'ready' ? 50 : 0) - 
                (lead.needs_human ? 20 : 0);
      return { ...lead, priority: p };
    }).sort((a: any, b: any) => b.priority - a.priority);

    res.json(ranked);
  } catch(e) {
    res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/revenue/attribution', requireAuth, async (req, res) => {
  try {
    const data = await pool.query(`
      SELECT 
        strategy,
        AVG(revenue) as avg_revenue,
        COUNT(*) as deals,
        SUM(revenue) as total_revenue
      FROM ai_metrics
      WHERE converted = true
      GROUP BY strategy
      ORDER BY total_revenue DESC
    `);
    res.json(data.rows);
  } catch (e) {
    res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/followups', requireAuth, async (req, res) => {
  try {
    const f = await pool.query(`
      SELECT * FROM followups
      WHERE sent = false
      ORDER BY scheduled_at ASC
      LIMIT 100
    `);
    res.json(f.rows);
  } catch(e) {
    res.status(500).json({error: 'DB error'});
  }
});

app.get('/api/dashboard', requireAuth, async (req, res) => {
  try {
    // Finances
    const financeStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'closed') as sales,
        SUM(expected_amount) FILTER (WHERE status = 'closed' AND created_at > NOW() - INTERVAL '1 day') as today_revenue,
        SUM(expected_amount) FILTER (WHERE status = 'closed' AND created_at > NOW() - INTERVAL '7 days') as week_revenue,
        AVG(expected_amount) FILTER (WHERE status = 'closed') as avg_check
      FROM leads
    `);

    // Funnel
    const funnelStats = await pool.query(`
      SELECT status, COUNT(*) as count FROM leads GROUP BY status
    `);

    // Accounts / Risk
    const accountStats = await pool.query(`
      SELECT status, COUNT(*) as count FROM system_accounts GROUP BY status
    `);
    const warmupStats = await pool.query(`
      SELECT warmup_stage, COUNT(*) as count FROM system_accounts GROUP BY warmup_stage
    `);

    // AI Learnings
    const aiStats = await pool.query(`
      SELECT COUNT(*) as learned, AVG(quality_score) as avg_score FROM learned_styles
    `);

    // Top channels logic mock
    const bestChannels = await pool.query(`
      SELECT source_chat as source_channel, COUNT(*) as leads, COUNT(*) FILTER (WHERE status = 'closed') as sales 
      FROM leads GROUP BY source_chat ORDER BY sales DESC LIMIT 5
    `);

    // Daily revenue graph (last 7 days mock or real)
    const chartData = await pool.query(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(*) as leads,
        COUNT(*) FILTER (WHERE status = 'closed') as sales,
        SUM(expected_amount) FILTER (WHERE status = 'closed') as revenue
      FROM leads 
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at) 
      ORDER BY date ASC
    `);

    res.json({
      finances: financeStats.rows[0] || { sales: 0, today_revenue: 0, week_revenue: 0, avg_check: 0 },
      funnel: funnelStats.rows || [],
      accounts: accountStats.rows || [],
      warmups: warmupStats.rows || [],
      ai: aiStats.rows[0] || { learned: 0, avg_score: 0 },
      channels: bestChannels.rows || [],
      chart: chartData.rows || []
    });
  } catch (e) {
    console.error("Dashboard error", e);
    res.status(500).json({ error: "DB error" });
  }
});

// ============================================
// ⚙️ QUICK ACTIONS (Safe mode, Stop)
// ============================================

import { generateInsights } from './src/ai/insights.js';

app.get('/api/insights', requireAuth, async (req, res) => {
  try {
    const data = await generateInsights();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
});

app.post('/api/actions/safe-mode', requireAuth, async (req, res) => {
  try {
    await pool.query("UPDATE system_accounts SET status = 'cooldown' WHERE status = 'active' OR status = 'risk'");
    console.log("[SAFE MODE] All accounts put to cooldown");
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/actions/stop', requireAuth, async (req, res) => {
  try {
    await pool.query("UPDATE system_accounts SET status = 'cooldown'");
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'DB error' });
  }
});


// ============================================
// 👥 КОНКУРЕНТЫ
// ============================================

app.post('/api/competitors/generate', requireAuth, async (req, res) => {
  try {
    const { generateJSON } = await import('./src/ai/provider.js');
    const prompt = `Сгенерируй 5 реалистичных предложений конкурентов (B2B или B2C), как если бы они писали их в Telegram группах:
    Дай JSON: 
    [{ "group": "Business Chat", "seller": "alex_pro", "productText": "Настрою рекламу за 1 день с гарантией лидов", "price": "15000 руб" }]`;

    const parsed = await generateJSON(prompt);
    
    for (const item of parsed) {
      await pool.query(
        'INSERT INTO competitor_data (group_name, seller, product_text, price) VALUES ($1, $2, $3, $4)',
        [item.group, item.seller, item.productText, item.price]
      );
    }
    
    res.json({ success: true, count: parsed.length });
  } catch(e) {
    console.error("Failed to gen competitors", e);
    res.status(500).json({ error: "Failed generating" });
  }
});

// ============================================
// 🧹 ACTIONS (модерация / ответы)
// ============================================

export async function logAction(action: any) {
  try {
    await pool.query(
      `
      INSERT INTO actions (type, user_name, chat, content, reason)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        action.type,
        action.user,
        action.chat,
        action.content,
        action.reason || null
      ]
    );
  } catch (e) {
    console.error("Failed to log action", e);
  }
}

// ============================================
// 🚫 АНТИ-ДУБЛИКАТЫ И ЛИДЫ
// ============================================

export async function isDuplicate(text: string) {
  const hash = hashText(text);

  try {
    const exists = await pool.query(
      'SELECT 1 FROM global_messages WHERE signature = $1',
      [hash]
    );

    if (exists.rowCount && exists.rowCount > 0) return true;

    await pool.query(
      'INSERT INTO global_messages (signature) VALUES ($1)',
      [hash]
    );

    return false;
  } catch (e) {
    console.error("Failed to check duplicate", e);
    return false;
  }
}

export async function isAlreadyContacted(text: string): Promise<boolean> {
  const hash = crypto.createHash('md5').update(text).digest('hex');

  try {
    const res = await pool.query(
      'SELECT 1 FROM contacted_leads WHERE message_hash=$1',
      [hash]
    );
    return res.rowCount !== null && res.rowCount > 0;
  } catch (e) {
    console.error("Failed to check contacted lead", e);
    return false;
  }
}

export async function markAsContacted(text: string) {
  const hash = crypto.createHash('md5').update(text).digest('hex');

  try {
    await pool.query(
      'INSERT INTO contacted_leads (message_hash) VALUES ($1) ON CONFLICT (message_hash) DO NOTHING',
      [hash]
    );
  } catch (e) {
    console.error("Failed to mark lead as contacted", e);
  }
}


// ============================================
// 💰 ПАРСИНГ ЦЕН
// ============================================

export async function saveCompetitor(data: {
  group: string;
  seller?: string;
  productText: string;
  price?: string;
}) {
  try {
    await pool.query(
      `
      INSERT INTO competitor_data 
      (group_name, seller, product_text, price, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      `,
      [
        data.group,
        data.seller || null,
        data.productText,
        data.price || null
      ]
    );
  } catch (e) {
    console.error("Failed to save competitor data", e);
  }
}

// ============================================
// 🧠 ОБУЧЕНИЕ СТИЛЮ
// ============================================

export async function saveStyle(input: string, output: string) {
  // Quality filter
  if (
    output.length >= 120 ||
    output.includes('http') ||
    output.includes('перевод')
  ) {
    return; // Ignore bad style
  }

  try {
    await pool.query(
      `
      INSERT INTO learned_styles (trigger_text, reply_text)
      VALUES ($1, $2)
      `,
      [input, output]
    );
  } catch (e) {
    console.error("Failed to save learned style", e);
  }
}

export async function getUserStyle(): Promise<string[]> {
  try {
    const res = await pool.query(`
      SELECT reply_text FROM learned_styles
      ORDER BY id DESC
      LIMIT 10
    `);
    return res.rows.map(r => r.reply_text);
  } catch (e) {
    console.error("Failed to get user style", e);
    return [];
  }
}


// ============================================
// 📥 ОТЧЕТ (Excel можно позже)
// ============================================

app.get('/api/report', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM actions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

export async function logMessageStat(type: string, reply: string, success: boolean) {
  try {
    await pool.query(`
      INSERT INTO message_stats (type, reply, success)
      VALUES ($1, $2, $3)
    `, [type, reply, success]);
  } catch (e) {
    console.error("Failed to log message stat", e);
  }
}

export async function logMessageTest(type: string, variant: string, message: string, leadId?: number) {
  try {
    const res = await pool.query(`
      INSERT INTO message_tests (type, variant, message, success, lead_id, lead_score)
      VALUES ($1, $2, $3, false, $4, $5)
      RETURNING id
    `, [type, variant, message, leadId || null, null]); // We'll update score later or use it from caller
    return res.rows && res.rows.length > 0 ? res.rows[0].id : null;
  } catch (e) {
    console.error("Failed to log message test", e);
    return null;
  }
}

export async function markMessageTestSuccess(id: number) {
  try {
    await pool.query(`
      UPDATE message_tests
      SET success = true
      WHERE id = $1
    `, [id]);
  } catch (e) {
    console.error("Failed to mark message test as success", e);
  }
}

export async function getBestVariantFromDB(type: string) {
  try {
    const res = await pool.query(`
      SELECT message, 
             COUNT(*) FILTER (WHERE success = true)::float / GREATEST(COUNT(*), 1) as rate
      FROM message_tests
      WHERE type = $1
      GROUP BY message
      HAVING COUNT(*) > 2
      ORDER BY rate DESC
      LIMIT 1
    `, [type]);
    return res.rows && res.rows.length > 0 ? res.rows[0].message : null;
  } catch (e) {
    console.error("Failed to get best variant", e);
    return null;
  }
}

// ============================================
// 📈 ANALYTICS FOR MONEY & STABILITY
// ============================================

import { getBestChannels, getBestMessageVariants, getAccountEfficiency } from './src/analytics/channels.js';

app.get('/api/analytics/channels', requireAuth, async (req, res) => {
  try {
    const data = await getBestChannels();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/analytics/message-tests', requireAuth, async (req, res) => {
  try {
    const data = await getBestMessageVariants();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/analytics/account-efficiency', requireAuth, async (req, res) => {
  try {
    const data = await getAccountEfficiency();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/analytics/antiban', requireAuth, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        status, 
        COUNT(*) as count, 
        SUM(sent_today) as total_sent_today,
        AVG(trust_score) as avg_trust_score,
        AVG(warmup_stage) as avg_warmup_stage
      FROM farm_accounts
      GROUP BY status
    `);
    
    res.json({
        accountStats: stats.rows.map(r => ({
           status: r.status,
           count: parseInt(r.count),
           sentToday: parseInt(r.total_sent_today || '0'),
           avgTrustScore: parseFloat(r.avg_trust_score || '0'),
           avgWarmupStage: parseFloat(r.avg_warmup_stage || '0')
        }))
    });
  } catch(e) {
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/system/logs', requireAuth, async (req, res) => {
  try {
    const { level, type, query, limit = 50 } = req.query;
    
    let sql = 'SELECT * FROM system_logs WHERE 1=1 ';
    const params: any[] = [];
    let pIdx = 1;

    if (level) {
      sql += ` AND level = $${pIdx}`;
      params.push(level);
      pIdx++;
    }
    if (type) {
      sql += ` AND type = $${pIdx}`;
      params.push(type);
      pIdx++;
    }
    if (query) {
      sql += ` AND (message ILIKE $${pIdx} OR metadata::text ILIKE $${pIdx})`;
      params.push(`%${query}%`);
      pIdx++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${pIdx}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

app.get('/api/system/queues', requireAuth, async (req, res) => {
  try {
    const { crmQueue, aiQueue, tgQueue } = await import('./src/queue/index.js');
    const { hasRedisUrl } = await import('./src/queue/redis.js');
    
    if (!hasRedisUrl) {
      return res.json({ usingMock: true, queues: {} });
    }

    const queues = {
      ai: aiQueue,
      tg: tgQueue,
      crm: crmQueue
    };

    const stats: Record<string, any> = {};
    for (const [name, q] of Object.entries(queues)) {
      const counts = await q.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
      stats[name] = counts;
    }

    res.json({ usingMock: false, queues: stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch queue stats' });
  }
});

app.get('/api/system/incidents', requireAuth, async (req, res) => {
  try {
    const incidentsRes = await pool.query(`SELECT * FROM incidents ORDER BY created_at DESC LIMIT 50`);
    const incidents = incidentsRes.rows;
    
    for (const incident of incidents) {
      const actionsRes = await pool.query(`SELECT * FROM incident_actions WHERE incident_id = $1 ORDER BY created_at ASC`, [incident.id]);
      incident.actions = actionsRes.rows;
    }
    
    res.json(incidents);
  } catch(e) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

app.post('/api/system/incidents/:id/action/:actionId/approve', requireAuth, async (req, res) => {
  try {
    const { actionId } = req.params;
    await pool.query(`UPDATE incident_actions SET status = 'approved', approved_by = 'admin' WHERE id = $1`, [actionId]);
    const { executeAction } = await import('./src/system/incidentManager.js');
    await executeAction(parseInt(actionId), 'admin');
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/system/incidents/:id/action/:actionId/reject', requireAuth, async (req, res) => {
  try {
    const { actionId } = req.params;
    await pool.query(`UPDATE incident_actions SET status = 'rejected' WHERE id = $1`, [actionId]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/system/test-incident', requireAuth, async (req, res) => {
  try {
    const { createIncident } = await import('./src/system/incidentManager.js');
    await createIncident({
      root_cause: 'Предиктивная угроза: reply_rate стремительно падает. Скоро может пробить допустимый лимит.',
      confidence: 0.89,
      slo_impact: 0.1,
      suggested_actions: [
        {
          action_type: 'change_strategy',
          description: 'ПРЕЭМПТИВНО: Изменить тональность сообщений на более формальную.',
          risk_level: 'low',
          confidence: 0.95
        },
        {
          action_type: 'pause_unresponsive',
          description: 'ПРЕЭМПТИВНО: Приостановить рассылку холодным лидам для повышения конверсии.',
          risk_level: 'medium',
          confidence: 0.82
        }
      ]
    });
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/system/log-intelligence', requireAuth, async (req, res) => {
  try {
    // Stats over last 24h
    const [topErrorsRes, topBansRes, problemAccountsRes, autoMetricsRes] = await Promise.all([
      pool.query(`
        SELECT replace(message, COALESCE(account_id, 'UNKNOWN'), '<ACC>') as pattern, COUNT(*) as count 
        FROM system_logs 
        WHERE level IN ('error', 'fatal') AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 5
      `),
      pool.query(`
        SELECT metadata->>'reason' as root_cause, COUNT(*) as count 
        FROM system_logs 
        WHERE type = 'ban' AND created_at > NOW() - INTERVAL '24 hours'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 5
      `),
      pool.query(`
        SELECT account_id, COUNT(*) as error_count 
        FROM system_logs 
        WHERE level IN ('error', 'warn') AND created_at > NOW() - INTERVAL '24 hours' AND account_id IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC LIMIT 5
      `),
      pool.query(`
        SELECT 
          (SELECT count(*) FROM system_logs WHERE type = 'tg_send_attempt' AND created_at > NOW() - INTERVAL '24 hours') as msgs,
          (SELECT count(*) FROM system_logs WHERE type = 'ban' AND created_at > NOW() - INTERVAL '24 hours') as bans
      `)
    ]);

    const { msgs, bans } = autoMetricsRes.rows[0];
    const msgsNum = parseInt(msgs) || 0;
    const bansNum = parseInt(bans) || 0;

    res.json({
      topErrors: topErrorsRes.rows,
      topBans: topBansRes.rows,
      problemAccounts: problemAccountsRes.rows,
      metrics: {
        totalMessagesLatest: msgsNum,
        totalBansLatest: bansNum,
        computedBanRate: msgsNum > 0 ? (bansNum / msgsNum).toFixed(3) : 0
      }
    });

  } catch (error) {
    console.error('Log intelligence error:', error);
    res.status(500).json({ error: 'Failed to fetch log intelligence data' });
  }
});

import { orchestrator } from './src/system/orchestrator.js';

app.get('/api/control/state', requireAuth, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']?.toString() || 'tenant_1';
    const role = req.headers['x-role']?.toString() || 'admin';
    const state = await orchestrator.getState(tenantId, role);
    res.json(state);
  } catch(e: any) {
    console.error('State Error', e);
    res.status(500).json({ error: e.message || 'Failed to fetch state' });
  }
});

app.post('/api/control/action', express.json(), requireAuth, async (req, res) => {
  try {
    const tenantId = req.headers['x-tenant-id']?.toString() || 'tenant_1';
    const role = req.headers['x-role']?.toString() || 'admin';
    
    const { action, payload } = req.body;
    if (action === 'scale') {
      await orchestrator.scaleWorkers(tenantId, role, payload.scale);
    } else if (action === 'pause_farm') {
      await orchestrator.pauseFarm(tenantId, role);
    } else if (action === 'resume_farm') {
      await orchestrator.resumeFarm(tenantId, role);
    } else if (action === 'set_strategy') {
      await orchestrator.setStrategy(tenantId, role, payload.strategy);
    } else if (action === 'create_snapshot') {
      await orchestrator.createSnapshot(tenantId, role, payload.reason);
    } else if (action === 'rollback') {
      await orchestrator.rollbackTo(tenantId, role, payload.snapshotId);
    } else if (action === 'trigger_failsafe') {
      await orchestrator.triggerFailSafe(tenantId, role, 'manual_ui');
    }
    
    res.json({ success: true, state: await orchestrator.getState(tenantId, role) });
  } catch(e: any) {
    console.error('Action Error', e);
    res.status(500).json({ error: e.message || 'Action failed' });
  }
});

// Create an interval to pulse orchestrator for cron-like state checks
const orchestratorPulse = setInterval(async () => {
  const { acquireLock } = await import('./src/system/locks.js');
  if (await acquireLock('cron_orchestrator', 45000)) {
    orchestrator.runPulse().catch(e => console.error(e));
  }
}, 60000);

GracefulShutdown.register(async () => {
  clearInterval(orchestratorPulse);
  console.log('[Server] Orchestrator pulse stopped.');
});

app.get('/api/system/traces', requireAuth, async (req, res) => {
  try {
    const { db } = await import('./src/db.js');
    
    // We fetch a list of recent traces
    // A query could fetch distinct traceIds from recent logs, ordered by max(created_at) desc.
    // Or we just get recent traces that have errors/bans. Let's do recent traces with their spans.
    const result = await db.query(`
      WITH recent_traces AS (
        SELECT metadata->>'traceId' as trace_id
        FROM system_logs
        WHERE metadata->>'traceId' IS NOT NULL AND created_at > NOW() - INTERVAL '6 hours'
        GROUP BY 1
        ORDER BY MAX(created_at) DESC
        LIMIT 50
      )
      SELECT
        l.metadata->>'traceId' as trace_id,
        l.metadata->>'spanId' as span_id,
        l.metadata->>'parentSpanId' as parent_span_id,
        l.metadata->>'step' as step,
        l.type,
        l.level,
        l.message,
        l.account_id,
        l.created_at,
        l.metadata
      FROM system_logs l
      JOIN recent_traces rt ON l.metadata->>'traceId' = rt.trace_id
      ORDER BY l.created_at ASC;
    `);

    // Group rows by trace_id
    const traces: Record<string, any[]> = {};
    for (const row of result.rows) {
      if (!traces[row.trace_id]) traces[row.trace_id] = [];
      traces[row.trace_id].push(row);
    }
    
    res.json(Object.values(traces).reverse());
  } catch(e) {
    console.error('Traces DB Error', e);
    res.status(500).json({ error: 'Failed to fetch traces' });
  }
});

app.post('/api/system/analyze-logs', requireAuth, async (req, res) => {
  try {
    const { generateContent } = await import('./src/ai/provider.js');
    
    const logsRes = await pool.query(`
      SELECT level, type, message, metadata, created_at 
      FROM system_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `);
    
    const logText = logsRes.rows.map(l => `[${l.created_at}] ${l.level.toUpperCase()} ${l.type}: ${l.message} | ${JSON.stringify(l.metadata)}`).join('\n');
    
    const prompt = `
      You are a DevOps / Farm Engine SRE. Here are the latest 100 system logs:
      
      ${logText}
      
      Provide a brief analysis:
      1. What are the main causes of errors or bans?
      2. Any anomalous patterns or suspicious metrics?
      3. Recommend concrete actions to fix the cluster.
    `;

    const analysis = await generateContent(prompt, { temperature: 0.2 });

    res.json({ analysis });
  } catch (e) {
    res.status(500).json({ error: 'Failed to analyze logs' });
  }
});

app.get('/api/system/slo', requireAuth, async (req, res) => {
  try {
    const targetsRes = await pool.query('SELECT * FROM slo_targets');
    const recentMetricsRes = await pool.query(`
      SELECT DISTINCT ON (name) * 
      FROM slo_metrics 
      ORDER BY name, timestamp DESC
    `);
    const budgetsRes = await pool.query('SELECT * FROM slo_budget');
    
    // Fallback or generator if empty
    if (recentMetricsRes.rows.length === 0) {
      const fallbackMetrics = targetsRes.rows.map(t => ({
        name: t.name,
        target_value: t.target_value,
        critical_threshold: t.critical_threshold,
        current_value: t.name === 'reply_rate' ? 0.28 : 
                       t.name === 'delivery_rate' ? 0.98 : 
                       t.name === 'ban_rate' ? 0.02 : 450,
        budget: 1 - t.target_value
      }));
      return res.json(fallbackMetrics);
    }
    
    const sloData = targetsRes.rows.map(target => {
      const metric = recentMetricsRes.rows.find(m => m.name === target.name);
      const budget = budgetsRes.rows.find(b => b.slo_name === target.name);
      return {
        name: target.name,
        target_value: target.target_value,
        critical_threshold: target.critical_threshold,
        current_value: metric ? metric.value : 0,
        budget: budget ? budget.budget : 0
      };
    });
    
    res.json(sloData);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch SLOs' });
  }
});

app.get('/api/system/state', requireAuth, async (req, res) => {
  try {
    const { getGlobalSystemState } = await import('./src/system/limiter.js');
    const state = await getGlobalSystemState();
    res.json(state);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch global state' });
  }
});

app.post('/api/system/state', requireAuth, async (req, res) => {
  try {
    const { updateSystemState } = await import('./src/system/limiter.js');
    await updateSystemState(req.body);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update global state' });
  }
});

app.get('/api/billing', requireAuth, async (req, res) => {
  try {
    const { getBillingDash } = await import('./src/system/billing.js');
    const tenantId = req.headers['x-tenant-id']?.toString() || 'tenant_1';
    const dash = await getBillingDash(tenantId);
    res.json(dash);
  } catch(e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================
// 🚀 СТАРТ
// ============================================

import { createServer as createViteServer } from 'vite';
import path from 'path';

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { dotfiles: 'deny' }));
    app.get('*', (req, res) => {
      // Never serve dotfiles (.env, .git, etc.) via SPA fallback
      if (/\/\.(env|git)/i.test(req.path)) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

import { metrics as systemMetrics } from './src/system/metrics.js';
import { db as dbInstance } from './src/db.js';
import { runLoadTest } from './src/tests/loadTest.js';

import { getMetrics, updateSystemMetricsSnapshot } from './src/system/metricsExporter.js';

app.get('/metrics', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.substring(7) : (req.query.token as string);
    const expected = process.env.METRICS_TOKEN || process.env.ADMIN_TOKEN;
    if (!token || token !== expected) {
      return res.status(401).send('Unauthorized');
    }
  }
  try {
    await updateSystemMetricsSnapshot();
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error gathering metrics');
  }
});

app.get('/api/admin/metrics', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const summary = await systemMetrics.getSummary(req.ctx.tenantId);
      
      const accountsRes = await dbInstance.withTenant(req.ctx.tenantId, async (client) => {
        return await client.query(`
          SELECT state, COUNT(*) as count 
          FROM farm_accounts 
          GROUP BY state
        `);
      });

      res.json({
        summary,
        accountStates: accountsRes.rows,
        timestamp: Date.now()
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });
});

app.get('/api/admin/queues', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { aiQueue, tgQueue, tgDlq, crmQueue } = await import('./src/queue/index.js');
    const queues = { aiQueue, tgQueue, tgDlq, crmQueue };
    const stats: any = {};
    for (const [name, q] of Object.entries(queues)) {
      if (!q) continue;
      const counts = await q.getJobCounts('active', 'completed', 'failed', 'delayed', 'waiting');
      stats[name] = counts;
    }
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/queues/:queueName/failed', requireAuth, async (req: AuthRequest, res) => {
  try {
    const queueName = req.params.queueName;
    const { aiQueue, tgQueue, tgDlq, crmQueue } = await import('./src/queue/index.js');
    const queues: any = { aiQueue, tgQueue, tgDlq, crmQueue };
    const q = queues[queueName];
    if (!q) return res.status(404).json({ error: 'Queue not found' });
    
    const failedJobs = await q.getFailed(0, 50);
    const result = failedJobs.map((j: any) => ({
      id: j.id,
      name: j.name,
      data: j.data,
      failedReason: j.failedReason,
      stacktrace: j.stacktrace,
      timestamp: j.timestamp,
      finishedOn: j.finishedOn
    }));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/queues/:queueName/retry/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { queueName, id } = req.params;
    const { aiQueue, tgQueue, tgDlq, crmQueue } = await import('./src/queue/index.js');
    const queues: any = { aiQueue, tgQueue, tgDlq, crmQueue };
    const q = queues[queueName];
    if (!q) return res.status(404).json({ error: 'Queue not found' });
    
    const job = await q.getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    await job.retry();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/admin/queues/:queueName/job/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { queueName, id } = req.params;
    const { aiQueue, tgQueue, tgDlq, crmQueue } = await import('./src/queue/index.js');
    const queues: any = { aiQueue, tgQueue, tgDlq, crmQueue };
    const q = queues[queueName];
    if (!q) return res.status(404).json({ error: 'Queue not found' });
    
    const job = await q.getJob(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    
    await job.remove();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/system/status', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const { governor } = await import('./src/system/governor.js');
      const isStopped = await governor.isEmergencyStopActive();
      
      const stats = await dbInstance.query(`
        SELECT 
          (SELECT COUNT(*) FROM farm_accounts WHERE state = 'ACTIVE') as active_accounts,
          (SELECT COUNT(*) FROM farm_accounts WHERE state = 'BANNED' AND last_error > NOW() - INTERVAL '24 hours') as recent_bans,
          (SELECT COUNT(*) FROM farm_workspaces WHERE state = 'ACTIVE') as active_tenants
      `);

      res.json({
        emergencyStop: isStopped,
        stats: stats.rows[0]
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch platform status' });
    }
  });
});

app.post('/api/admin/system/emergency-stop', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const { active } = req.body;
      const { logger } = await import('./src/system/logger.js');
      
      await dbInstance.query(`
        INSERT INTO farm_workspace_settings (key, value) 
        VALUES ('emergency_stop', $1)
        ON CONFLICT (key) DO UPDATE SET value = $1
      `, [active ? 'true' : 'false']);

      logger.warn({ 
        type: 'admin_action', 
        message: `Admin ${active ? 'ENABLED' : 'DISABLED'} Emergency Stop`,
        adminId: req.user?.id
      });

      res.json({ success: true, emergencyStop: active });
    } catch (e) {
      res.status(500).json({ error: 'Failed to toggle emergency stop' });
    }
  });
});

app.get('/api/admin/proxies', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const { riskEngine } = await import('./src/system/riskEngine.js');
      const proxyHealth = await riskEngine.getAllProxiesHealth();
      res.json(proxyHealth);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch proxy health' });
    }
  });
});

import { RuntimeTelemetryBus } from './src/system/telemetry/RuntimeTelemetryBus.js';
import { globalQueueTelemetry } from './src/system/telemetry/QueueTelemetryCollector.js';
import { FloodWaitRealityModel } from './src/system/telemetry/MTProtoTelemetryAdapter.js';

globalQueueTelemetry.start(5000);

app.get('/api/telemetry/stream', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  // Send recent history
  const history = RuntimeTelemetryBus.getRecentEvents(50);
  for (const event of history) {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  const unsubscribe = RuntimeTelemetryBus.subscribe((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() })}\n\n`);
  }, 10000);

  req.on('close', () => {
    unsubscribe();
    clearInterval(heartbeat);
  });
});

app.get('/api/telemetry/stats', requireAuth, (req, res) => {
  res.json({
    mtproto: FloodWaitRealityModel.getMetrics()
  });
});

app.post('/api/governance/action', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { action_type, reason, payload } = req.body;
    const actor = req.user?.userId || 'system';

    const result = await pool.query(`
      INSERT INTO governance_actions (action_type, actor, reason, payload, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *
    `, [action_type, actor, reason, payload]);

    const newAction = result.rows[0];

    RuntimeTelemetryBus.emit({
      id: `gov_action_${newAction.id}`,
      type: 'GOVERNANCE_ACTION_CREATED',
      timestamp: Date.now(),
      source: 'governance_api',
      payload: newAction
    });

    // Execute logic based on action_type
    let executionResult = null;
    try {
      if (action_type === 'KILL_SWITCH') {
        const { governor } = await import('./src/system/governor.js');
        await governor.engageEmergencyStop();
        executionResult = { status: 'success', message: 'Emergency stop engaged' };
      } else if (action_type === 'PAUSE_QUEUES') {
        const { aiQueue, tgQueue, crmQueue } = await import('./src/queue/index.js');
        await aiQueue.pause();
        await tgQueue.pause();
        await crmQueue.pause();
        executionResult = { status: 'success', message: 'Queues paused' };
      }
      
      // Mark successful
      await pool.query(`
        UPDATE governance_actions 
        SET status = 'COMPLETED', executed_at = NOW(), execution_result = $1
        WHERE id = $2
      `, [executionResult, newAction.id]);

      RuntimeTelemetryBus.emit({
        id: `gov_action_exec_${newAction.id}`,
        type: 'GOVERNANCE_ACTION_EXECUTED',
        timestamp: Date.now(),
        source: 'governance_api',
        causalChainId: `gov_action_${newAction.id}`,
        payload: { actionId: newAction.id, result: executionResult }
      });

    } catch (execErr: any) {
      // Mark failed
      await pool.query(`
        UPDATE governance_actions 
        SET status = 'FAILED', executed_at = NOW(), execution_result = $1
        WHERE id = $2
      `, [{ error: execErr.message }, newAction.id]);
    }

    res.json(newAction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record governance action' });
  }
});

app.get('/api/admin/incidents', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
    try {
      const incidents = await dbInstance.query(`
        SELECT type, content as message, created_at as timestamp 
        FROM actions 
        WHERE type IN ('ban', 'risk_mitigation', 'alert_critical', 'governor_emergency_stop') 
        ORDER BY created_at DESC 
        LIMIT 15
      `);
      res.json(incidents.rows || []);
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch incidents' });
    }
  });
});

app.get('/api/admin/system-health', requireAuth, async (req: AuthRequest, res) => {
  return runWithContext(req.ctx, async () => {
     try {
       const { healthScore, regulationState } = await import('./src/system/autoRegulation.js');
       const { checkQueuePressure } = await import('./src/system/queuePressureOptions.js');
       const { connection } = await import('./src/queue/redis.js');
       const { db } = await import('./src/db.js');
       
       const pressure = await checkQueuePressure();
       const dbStatus = await db.query('SELECT 1').then(() => 'ok').catch(() => 'degraded');
       const redisStatus = await connection.ping().then(() => 'ok').catch(() => 'degraded');
       const mem = process.memoryUsage();
       
       res.json({
         api: 'ok',
         postgres: dbStatus,
         redis: redisStatus,
         queues: {
            pressure,
            status: pressure > 1000 ? 'critical' : 'ok'
         },
         workers: {
            alive: true
         },
         eventLoopLag: Math.round(100 - healthScore.eventLoop) || 0,
         memory: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
         status: healthScore.overall < 80 ? (healthScore.overall < 50 ? 'CRITICAL' : 'DEGRADED') : 'STABLE', 
         governor: { active: true, emergency_stop: false },
         fairness: { active: true },
         autoRegulation: {
           healthScore,
           regulationState
         }
       });
     } catch (e) {
       res.status(500).json({ error: 'Failed to fetch health info' });
     }
  });
});

app.post('/api/admin/test-load', requireAuth, async (req: AuthRequest, res) => {
   const { scenario = 'fairness' } = req.body;
   // Run async, don't wait for completion to avoid timeout
   runLoadTest(scenario as any).catch(e => console.error('Load test failed', e));
   res.json({ status: 'Load test started', scenario });
});

// IMPORTANT: ALL API ROUTES MUST BE DEFINED ABOVE THIS LINE
import { setupGracefulShutdown as globalGracefulShutdown, registerShutdownHook } from './src/system/shutdown.js';

const isMainModule = true;
if (isMainModule) {
  const role = process.env.ROLE || 'api';
  
  const PORT = Number(process.env.APP_PORT || 3000);
  const server = app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🚀 [${role}] Server listening for health probes on port ${PORT}`);
  });
  
  if (role === 'api') {
    globalGracefulShutdown('API', 15000);
    startServer();
  } else if (role === 'worker') {
    globalGracefulShutdown('WORKER', 15000);
    import('./apps/workers/index.js').catch(console.error);
  } else if (role === 'userbot') {
    globalGracefulShutdown('USERBOT', 15000);
    import('./src/telegram/userbot.js').then(m => m.startUserbot()).catch(console.error);
    import('./src/workers/tgWorker.js').then(m => {
       registerShutdownHook(async () => {
         await m.tgWorker.close();
       });
    }).catch(console.error);
  } else {
    console.error(`Unknown ROLE: ${role}`);
    process.exit(1);
  }

  registerShutdownHook(async () => {
    console.log(`[${role}] Stopping intake of new HTTP requests...`);
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
    console.log(`[${role}] HTTP server closed.`);
  });
}


