import { Pool } from 'pg';
import dotenv from 'dotenv';
import { getContext } from './system/context.js';

dotenv.config();

let poolInstance: Pool | null = null;
let dbAvailable = true;

function getPool(): Pool {
  const connStr = process.env.DATABASE_URL;
  if (!connStr && process.env.NODE_ENV === 'production') {
    throw new Error('FATAL runtime error: DATABASE_URL environment variable is strictly required in production but was not found. Please configure it in your environment/dashboard.');
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: connStr,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'crm_bot',
      connectionTimeoutMillis: 2000,
    });

    poolInstance.on('error', (err: any) => {
      if (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'))) {
        console.error('⚠️ PostgreSQL background connection refused.');
      } else {
        console.error('Unexpected error on idle database client', err);
      }
    });
  }
  return poolInstance;
}

// Safe wrapper around db
export async function closeDB() {
  if (dbAvailable && poolInstance) {
    await poolInstance.end();
  }
}

export const db = {
  query: async (text: string, params?: any[]): Promise<any> => {
    // AUTOMATIC CONTEXT PROPAGATION
    const ctx = getContext();
    if (ctx?.tenantId) {
       return db.withTenant(ctx.tenantId, (client) => params ? client.query(text, params) : client.query(text));
    }

    try {
      const res = await getPool().query(text, params);
      dbAvailable = true; // Recover state if it succeeds
      return res;
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ECONNREFUSED'))) {
         console.error('⚠️ PostgreSQL connection refused. Retrying on next query.');
         dbAvailable = false;
         throw e;
      }
      throw e;
    }
  },
  run: async (text: string, params?: any[]): Promise<any> => {
    return db.query(text, params);
  },
  // Use this function when performing queries under a specific tenant context
  withTenant: async <T>(tenantId: string, runQuery: (client: any) => Promise<T>): Promise<any> => {
    const activeTenantId = tenantId || getContext()?.tenantId;
    if (!activeTenantId) {
      throw new Error("Tenant context missing");
    }
    let client;
    try {
      client = await getPool().connect();
    } catch (e: any) {
      if (e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ECONNREFUSED'))) {
        dbAvailable = false;
        throw e;
      }
      throw e;
    }
    try {
      await client.query('BEGIN');
      await client.query(`SELECT set_config('app.tenant_id', $1, true)`, [String(activeTenantId)]);
      await client.query(`SELECT set_config('app.workspace_id', $1, true)`, [String(activeTenantId)]);
      const result = await runQuery(client);
      await client.query('COMMIT');
      dbAvailable = true;
      return result;
    } catch (e: any) {
      await client.query('ROLLBACK');
      if (e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ECONNREFUSED'))) {
         dbAvailable = false;
      }
      throw e;
    } finally {
      client.release();
    }
  },
  connect: async () => {
    return await getPool().connect();
  }
};

export async function initDB() {
  let client;
  try {
    client = await getPool().connect();
  } catch (error: any) {
    console.error('⚠️ PostgreSQL connection failed during init. Continuing startup; database will attempt to reconnect on demand.', error.message);
    return;
  }
  
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      CREATE TABLE IF NOT EXISTS saas_users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE,
        password TEXT,
        plan TEXT DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        owner_id UUID REFERENCES saas_users(id),
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER DEFAULT 1,
        status TEXT DEFAULT 'RESERVED', -- RESERVED, CONFIRMED, REVERTED
        trace_id TEXT,
        expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '1 hour'),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_counters (
        tenant_id TEXT NOT NULL,
        metric TEXT NOT NULL,
        value INTEGER DEFAULT 0,
        PRIMARY KEY (tenant_id, metric)
      );

      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        action TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS outbox_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type TEXT NOT NULL,
        payload JSONB NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pricing_engine_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID,
        old_price DECIMAL(10, 2),
        new_price DECIMAL(10, 2),
        changed_by TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ai_cost_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_id TEXT,
        tokens_prompt INTEGER,
        tokens_completion INTEGER,
        cost_usd DECIMAL(10, 6),
        actor TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_metrics (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value FLOAT DEFAULT 1.0,
        tags JSONB DEFAULT '{}',
        tenant_id TEXT,
        trace_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON system_metrics (name, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_metrics_tenant ON system_metrics (tenant_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS plans (
        id TEXT PRIMARY KEY,
        name TEXT,
        ai_calls_limit INTEGER,
        accounts_limit INTEGER
      );

      CREATE TABLE IF NOT EXISTS tenant_subscriptions (
        tenant_id TEXT PRIMARY KEY,
        plan_id TEXT REFERENCES plans(id),
        status TEXT,
        current_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspace_settings (
        workspace_id UUID PRIMARY KEY REFERENCES workspaces(id),
        settings JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS farm_workspaces (
        id SERIAL PRIMARY KEY,
        name TEXT,
        state TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED'
        tenant_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS farm_workspace_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS global_settings (
        id INTEGER PRIMARY KEY,
        settings JSONB DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_seen TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS actions (
        id SERIAL PRIMARY KEY,
        type TEXT,
        chat TEXT,
        user_name TEXT,
        content TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS crm_groups (
        id SERIAL PRIMARY KEY,
        name TEXT,
        link TEXT,
        description TEXT,
        analysis JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS competitor_data (
        id SERIAL PRIMARY KEY,
        group_name TEXT,
        seller TEXT,
        product_text TEXT,
        price TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS history (
        id SERIAL PRIMARY KEY,
        chat_title TEXT,
        username TEXT,
        text TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS global_messages (
        id SERIAL PRIMARY KEY,
        signature TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contacted_leads (
        id SERIAL PRIMARY KEY,
        message_hash TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        chat_id TEXT,
        role TEXT,
        message TEXT,
        lead_id INTEGER,
        account_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_style_profiles (
        user_id TEXT PRIMARY KEY,
        avg_length INT,
        emoji_usage FLOAT,
        punctuation_style TEXT,
        slang_level FLOAT,
        message_speed FLOAT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_behavior_profiles (
        user_id TEXT PRIMARY KEY,
        avg_reply_delay INT,
        reply_probability FLOAT,
        followup_probability FLOAT,
        aggression_level FLOAT,
        persistence_level FLOAT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversation_state (
        chat_id TEXT PRIMARY KEY,
        stage TEXT,
        last_intent TEXT,
        sentiment FLOAT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS publish_reputation (
        id SERIAL PRIMARY KEY,
        post_id INTEGER,
        views INTEGER DEFAULT 0,
        reactions INTEGER DEFAULT 0,
        forwards INTEGER DEFAULT 0,
        complaints INTEGER DEFAULT 0,
        spam_reports INTEGER DEFAULT 0,
        shadow_restricted BOOLEAN DEFAULT FALSE,
        final_score INTEGER DEFAULT 0,
        strategy VARCHAR(255) DEFAULT 'default',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS strategy_reputation (
        id SERIAL PRIMARY KEY,
        strategy_name VARCHAR(255) UNIQUE,
        success_rate FLOAT DEFAULT 0,
        avg_risk FLOAT DEFAULT 0,
        avg_conversion FLOAT DEFAULT 0,
        rejection_rate FLOAT DEFAULT 0,
        weight FLOAT DEFAULT 1.0,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS evolution_proposals (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        changes JSONB,
        reasoning TEXT,
        safety_score FLOAT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_incidents (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100),
        severity VARCHAR(50),
        description TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS decision_fingerprints (
        id SERIAL PRIMARY KEY,
        hash VARCHAR(255) UNIQUE,
        policy_version VARCHAR(50),
        prompt_version VARCHAR(50),
        model_version VARCHAR(50),
        agent_id VARCHAR(100),
        confidence FLOAT,
        causal_chain_id VARCHAR(255),
        payload JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS prompt_registry (
        id SERIAL PRIMARY KEY,
        tag VARCHAR(100),
        version VARCHAR(50),
        content TEXT,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS safety_hard_limits (
        id SERIAL PRIMARY KEY,
        limit_name VARCHAR(100) UNIQUE,
        max_value FLOAT,
        current_value FLOAT DEFAULT 0,
        reset_interval VARCHAR(50),
        last_reset TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pending_autoposts (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(50) DEFAULT 'default',
        original_text TEXT,
        proposed_text TEXT,
        source_channel VARCHAR(255),
        target_channel VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS system_accounts (
        id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'active',
        health_score INT DEFAULT 100,
        flood_count INT DEFAULT 0,
        cooldown_until TIMESTAMP,
        role TEXT DEFAULT 'hybrid',
        messages_last_hour INT DEFAULT 0,
        messages_today INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        username TEXT,
        first_name TEXT,
        source_chat TEXT,
        source_message TEXT,
        intent TEXT,
        temperature TEXT,
        budget TEXT,
        confidence FLOAT,
        status TEXT DEFAULT 'new',
        stage TEXT DEFAULT 'interest',
        last_message_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        contact_info TEXT,
        trust_score FLOAT DEFAULT 1.0,
        avg_reply_speed_minutes INTEGER DEFAULT 60,
        completed_orders INTEGER DEFAULT 0,
        defects_percent FLOAT DEFAULT 0.0,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'draft',
        price_current DECIMAL(10, 2),
        margin_min_percent FLOAT DEFAULT 15.0,
        cost_price DECIMAL(10, 2),
        meta_title TEXT,
        meta_description TEXT,
        canonical_url TEXT,
        schema_org JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS supplier_price_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES suppliers(id),
        product_id UUID,
        price DECIMAL(10, 2),
        currency TEXT DEFAULT 'RUB',
        discount_given DECIMAL(10, 2),
        availability TEXT,
        recorded_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id INTEGER REFERENCES leads(id),
        product_id UUID,
        supplier_id UUID REFERENCES suppliers(id),
        status TEXT DEFAULT 'pending_stock_check',
        total_price DECIMAL(10, 2),
        margin_actual DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity TEXT NOT NULL,
        action TEXT NOT NULL,
        ai_decision TEXT,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE system_accounts ADD COLUMN last_used_at TIMESTAMP;
          ALTER TABLE system_accounts ADD COLUMN trust_score FLOAT DEFAULT 0;
          ALTER TABLE system_accounts ADD COLUMN warmup_stage TEXT DEFAULT 'new';
          ALTER TABLE system_accounts ADD COLUMN proxy_id TEXT;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'farm tracking columns already exist in system_accounts.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      -- Add stage column if it doesn't exist (for existing DBs)
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE leads ADD COLUMN stage TEXT DEFAULT 'interest';
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column stage already exists in leads.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      -- Add payment columns if they don't exist
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE leads ADD COLUMN expected_amount NUMERIC;
          ALTER TABLE leads ADD COLUMN expected_card_last4 TEXT;
          ALTER TABLE leads ADD COLUMN payment_status TEXT DEFAULT 'waiting';
          ALTER TABLE leads ADD COLUMN is_hot BOOLEAN DEFAULT false;
          ALTER TABLE leads ADD COLUMN score FLOAT DEFAULT 0;
          ALTER TABLE leads ADD COLUMN needs_human BOOLEAN DEFAULT false;
          ALTER TABLE leads ADD COLUMN workspace_id UUID;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'columns already exist in leads.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE conversations ADD COLUMN workspace_id UUID;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column workspace_id already exists in conversations.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE sales_metrics ADD COLUMN workspace_id UUID;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column workspace_id already exists in sales_metrics.';
          WHEN undefined_table THEN RAISE NOTICE 'table sales_metrics does not exist yet, skipping.';
        END;
      END $$;

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE ai_metrics ADD COLUMN workspace_id UUID;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'column workspace_id already exists in ai_metrics.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      CREATE TABLE IF NOT EXISTS learned_styles (
        id SERIAL PRIMARY KEY,
        trigger_text TEXT,
        reply_text TEXT,
        context TEXT,
        intent TEXT,
        score FLOAT DEFAULT 0.5,
        quality_score FLOAT DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS message_variants (
        id SERIAL PRIMARY KEY,
        variant_text TEXT NOT NULL,
        type TEXT,
        reply_count INTEGER DEFAULT 0,
        engagement_score FLOAT DEFAULT 0.0,
        conversion_count INTEGER DEFAULT 0,
        block_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        cooldown_until TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS message_tests (
        id SERIAL PRIMARY KEY,
        type TEXT,
        variant TEXT,
        message TEXT,
        success BOOLEAN DEFAULT false,
        lead_id INTEGER,
        lead_score FLOAT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS raw_messages (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        text TEXT,
        is_outgoing BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER,
        amount NUMERIC,
        card_last4 TEXT,
        raw_sms TEXT,
        external_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_risks (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        risk_level TEXT,
        flags JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS relationship_memory (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        trust_score FLOAT DEFAULT 0.5,
        emotion_bias TEXT DEFAULT 'neutral',
        last_interaction TIMESTAMP,
        message_count INT DEFAULT 0,
        positive_events INT DEFAULT 0,
        negative_events INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS knowledge_base (
        id SERIAL PRIMARY KEY,
        source TEXT,
        risks JSONB,
        limits JSONB,
        recommendations JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS message_stats (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50),
        reply TEXT,
        success BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS decision_logs (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        input TEXT,
        risk_level TEXT,
        intent JSONB,
        emotion TEXT,
        strategy TEXT,
        reply_text TEXT,
        delay_ms INTEGER,
        lead_score FLOAT,
        variant_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        avg_price NUMERIC DEFAULT 0,
        max_price NUMERIC DEFAULT 0,
        trust_score FLOAT DEFAULT 0.5,
        is_wholesale BOOLEAN DEFAULT false,
        last_product TEXT,
        negotiation_style TEXT DEFAULT 'neutral',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE EXTENSION IF NOT EXISTS vector;

      CREATE TABLE IF NOT EXISTS training_conversations (
        id SERIAL PRIMARY KEY,
        chat_id TEXT,
        user_id TEXT,
        role TEXT,
        message TEXT,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sales_metrics (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        chat_id TEXT,
        event TEXT,
        value FLOAT,
        meta JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS followups (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        chat_id TEXT,
        lead_id INT,
        stage TEXT,
        step INT DEFAULT 0,
        scheduled_at TIMESTAMP,
        sent BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS ai_experiments (
        id SERIAL PRIMARY KEY,
        name TEXT,
        strategy_a TEXT,
        strategy_b TEXT,
        metric TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        ended_at TIMESTAMP,
        winner TEXT
      );

      CREATE TABLE IF NOT EXISTS ai_metrics (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        experiment_id INT,
        strategy TEXT,
        replied BOOLEAN,
        converted BOOLEAN,
        revenue INT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS group_offers (
        id SERIAL PRIMARY KEY,
        chat_id TEXT,
        product TEXT,
        offered_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS user_seen_products (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        product TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE UNIQUE INDEX IF NOT EXISTS unique_active_lead 
      ON leads (user_id, source_chat)
      WHERE status NOT IN ('closed', 'lost');

      CREATE TABLE IF NOT EXISTS farm_channels (
        id SERIAL PRIMARY KEY,
        account_id INTEGER,
        channel_id TEXT,
        username TEXT,
        title TEXT,
        type TEXT DEFAULT 'micro',
        parent_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS farm_accounts (
        id SERIAL PRIMARY KEY,
        phone TEXT,
        session TEXT,
        proxy TEXT,
        status TEXT DEFAULT 'warmup', -- 'active', 'sleep', 'banned', 'warmup', 'risk', 'resting'
        state TEXT DEFAULT 'NEW', -- FSM state: NEW, WARMING_UP, ACTIVE, LIMITED, COOLING_DOWN, SUSPENDED, BANNED
        role TEXT DEFAULT 'hybrid', -- 'responder', 'hunter', 'hybrid'
        trust_score FLOAT DEFAULT 0.0,
        daily_limit INTEGER DEFAULT 50,
        sent_today INTEGER DEFAULT 0,
        last_used_at TIMESTAMP,
        cooldown_until TIMESTAMP,
        flood_count INTEGER DEFAULT 0,
        last_error TIMESTAMP,
        warmup_stage INTEGER DEFAULT 1,
        behavior_profile JSONB DEFAULT '{"typingSpeed": [40, 80], "emojiUsage": 0.2, "messageLength": "short", "slangLevel": 0.3}',
        policy JSONB DEFAULT '{"canInitiate": true, "canReply": true, "allowedChatTypes": ["private", "group"], "maxMessagesPerHour": 30, "cooldownMs": 5000}',
        created_at TIMESTAMP DEFAULT NOW(),
        tenant_id TEXT
      );

      CREATE TABLE IF NOT EXISTS account_state_events (
        id SERIAL PRIMARY KEY,
        account_id INTEGER REFERENCES farm_accounts(id),
        from_state TEXT,
        to_state TEXT,
        reason TEXT,
        trace_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        tenant_id TEXT
      );

      CREATE TABLE IF NOT EXISTS account_messages (
        id SERIAL PRIMARY KEY,
        account_id TEXT,
        text TEXT,
        embedding vector(768),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_account_messages_embedding
      ON account_messages
      USING ivfflat (embedding vector_cosine_ops);

      CREATE TABLE IF NOT EXISTS group_training_messages (
        id SERIAL PRIMARY KEY,
        chat_id TEXT,
        user_id TEXT,
        text TEXT,
        embedding vector(768),
        type TEXT, -- 'dialog' | 'sales' | 'noise'
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS global_brain (
        id SERIAL PRIMARY KEY,
        pattern_type TEXT, -- 'banned_word', 'bad_pattern', 'working_strategy', 'banned_pattern'
        pattern_value TEXT,
        score FLOAT DEFAULT 0.0,
        uses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_state (
        key TEXT PRIMARY KEY,
        value JSONB,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        level TEXT,
        type TEXT,
        account_id INTEGER,
        chat_id TEXT,
        message TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS slo_targets (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE,
        target_value FLOAT,
        critical_threshold FLOAT,
        window_minutes INTEGER DEFAULT 60,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS slo_metrics (
        id SERIAL PRIMARY KEY,
        name TEXT REFERENCES slo_targets(name),
        value FLOAT,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO slo_targets (name, target_value, critical_threshold, window_minutes)
      VALUES 
        ('reply_rate', 0.25, 0.15, 60),
        ('delivery_rate', 0.95, 0.85, 60),
        ('ban_rate', 0.05, 0.10, 1440),
        ('system_latency', 500, 2000, 15)
      ON CONFLICT (name) DO NOTHING;

      CREATE TABLE IF NOT EXISTS slo_budget (
        slo_name TEXT PRIMARY KEY REFERENCES slo_targets(name),
        budget FLOAT,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        status TEXT DEFAULT 'ACTIVE',
        slo_impact FLOAT DEFAULT 0,
        regions_affected JSONB DEFAULT '[]',
        root_cause TEXT,
        confidence FLOAT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS incident_actions (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER REFERENCES incidents(id),
        action_type TEXT,
        description TEXT,
        risk_level TEXT,
        confidence FLOAT,
        status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'executed'
        approved_by TEXT,
        executed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS governance_actions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action_type VARCHAR(255) NOT NULL,
        actor VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        payload JSONB DEFAULT '{}'::jsonb,
        status VARCHAR(50) DEFAULT 'PENDING',
        execution_result JSONB,
        correlation_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        executed_at TIMESTAMP WITH TIME ZONE
      );
      CREATE TABLE IF NOT EXISTS action_logs (
        id SERIAL PRIMARY KEY,
        action_id INTEGER REFERENCES incident_actions(id),
        incident_id INTEGER REFERENCES incidents(id),
        action_name TEXT,
        executed_by TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_group_training_embedding
      ON group_training_messages
      USING ivfflat (embedding vector_cosine_ops);

      DO $$
      BEGIN
        BEGIN
          ALTER TABLE farm_accounts ADD COLUMN session TEXT;
          ALTER TABLE farm_accounts ADD COLUMN proxy TEXT;
          ALTER TABLE farm_accounts ADD COLUMN role TEXT DEFAULT 'hybrid';
          ALTER TABLE farm_accounts ADD COLUMN trust_score FLOAT DEFAULT 0.0;
          ALTER TABLE farm_accounts ADD COLUMN daily_limit INTEGER DEFAULT 50;
          ALTER TABLE farm_accounts ADD COLUMN sent_today INTEGER DEFAULT 0;
          ALTER TABLE farm_accounts ADD COLUMN last_used_at TIMESTAMP;
          ALTER TABLE farm_accounts ADD COLUMN cooldown_until TIMESTAMP;
          ALTER TABLE farm_accounts ADD COLUMN flood_count INTEGER DEFAULT 0;
          ALTER TABLE farm_accounts ADD COLUMN last_error TIMESTAMP;
          ALTER TABLE farm_accounts ADD COLUMN warmup_stage INTEGER DEFAULT 1;
          ALTER TABLE farm_accounts ADD COLUMN behavior_profile JSONB DEFAULT '{"typingSpeed": [40, 80], "emojiUsage": 0.2, "messageLength": "short", "slangLevel": 0.3}';
          ALTER TABLE farm_accounts ADD COLUMN policy JSONB DEFAULT '{"canInitiate": true, "canReply": true, "allowedChatTypes": ["private", "group"], "maxMessagesPerHour": 30, "cooldownMs": 5000}';
          ALTER TABLE farm_accounts ADD COLUMN reply_rate FLOAT DEFAULT 0.0;
          ALTER TABLE farm_accounts ADD COLUMN block_events INTEGER DEFAULT 0;
          ALTER TABLE farm_accounts ADD COLUMN performance_score FLOAT DEFAULT 0.0;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'columns already exist in farm_accounts.';
        END;

        BEGIN
          ALTER TABLE pending_autoposts ADD COLUMN risk_score INTEGER DEFAULT 0;
          ALTER TABLE pending_autoposts ADD COLUMN risk_reasons TEXT;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'risk_score already exists in pending_autoposts.';
        END;

        BEGIN
          ALTER TABLE decision_logs ADD COLUMN variant_id INTEGER DEFAULT NULL;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'variant_id already exists in decision_logs.';
        END;

        BEGIN
          ALTER TABLE conversations ADD COLUMN account_id INTEGER DEFAULT NULL;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'account_id already exists in conversations.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      -- Add type and parent_id columns if they don't exist
      DO $$
      BEGIN
        BEGIN
          ALTER TABLE farm_channels ADD COLUMN type TEXT DEFAULT 'micro';
          ALTER TABLE farm_channels ADD COLUMN parent_id TEXT;
        EXCEPTION
          WHEN duplicate_column THEN RAISE NOTICE 'columns already exist in farm_channels.';
          WHEN undefined_table THEN NULL;
        END;
      END $$;

      -- Add tenant_id columns and policies for multi-tenancy tracking
      DO $$
      DECLARE
        t text;
        tables text[] := ARRAY['leads', 'conversations', 'farm_accounts', 'usage_events', 'followups', 'ai_experiments', 'ai_metrics', 'sales_metrics', 'training_conversations', 'account_state_events', 'system_metrics'];
      BEGIN
        FOREACH t IN ARRAY tables LOOP
          BEGIN
            EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id TEXT', t);
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          
          EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
          EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
          
          -- Drop existing to avoid conflicts
          EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', t, t);
          EXECUTE format('DROP POLICY IF EXISTS tenant_insert_%I ON %I', t, t);
          EXECUTE format('DROP POLICY IF EXISTS tenant_update_%I ON %I', t, t);
          EXECUTE format('DROP POLICY IF EXISTS tenant_delete_%I ON %I', t, t);
          
          -- Recreate
          EXECUTE format('CREATE POLICY tenant_isolation_%I ON %I USING (tenant_id = current_setting(''app.tenant_id'', true))', t, t);
          EXECUTE format('CREATE POLICY tenant_insert_%I ON %I FOR INSERT WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))', t, t);
          EXECUTE format('CREATE POLICY tenant_update_%I ON %I FOR UPDATE USING (tenant_id = current_setting(''app.tenant_id'', true))', t, t);
          EXECUTE format('CREATE POLICY tenant_delete_%I ON %I FOR DELETE USING (tenant_id = current_setting(''app.tenant_id'', true))', t, t);
        END LOOP;
        
        -- Special case for workspaces
        ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS tenant_isolation_workspaces ON workspaces;
        CREATE POLICY tenant_isolation_workspaces ON workspaces USING (id::text = current_setting('app.tenant_id', true));
      END $$;

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);
      CREATE INDEX IF NOT EXISTS idx_actions_type ON actions(type);
      CREATE INDEX IF NOT EXISTS idx_competitor_date ON competitor_data(created_at);
      CREATE INDEX IF NOT EXISTS idx_crm_analysis ON crm_groups USING GIN (analysis);
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, chat_id);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_lead ON conversations(lead_id);
    `);
    console.log('PostgreSQL Database initialized successfully');

    // NO DEMO DATA GENERATION IN PRODUCTION
    // Accounts and leads should be populated organically

  } catch (error) {
    console.error('Failed to initialize PostgreSQL Database:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

export function getDB() {
  return db;
}

export function getDb() {
  return db;
}


