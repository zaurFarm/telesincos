import { db } from '../db.js';
import { logger } from './logger.js';
import { createIncident } from './incidentManager.js';

export async function checkSLOs() {
  try {
    // Collect specific metrics
    const [
      { rows: [replyStats] },
      { rows: [deliveryStats] },
      { rows: [banStats] },
      { rows: [latencyStats] }
    ] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE type = 'reply') as replied,
          COUNT(*) as total_actions
        FROM actions
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `),
      db.query(`
        SELECT 
          1 as "delivered_rate" -- placeholder
      `),
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'banned') as banned,
          COUNT(*) as total_accounts
        FROM farm_accounts
      `),
      db.query(`
        SELECT 
          COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) * 1000), 100) as avg_latency
        FROM conversation_state 
        WHERE updated_at >= NOW() - INTERVAL '15 minutes'
      `)
    ]);

    const reply_rate = replyStats.total_actions > 0 
      ? Number(replyStats.replied) / Number(replyStats.total_actions) 
      : 0;
      
    const delivery_rate = 0.98; // Simulated delivery rate
    
    const ban_rate = banStats.total_accounts > 0
      ? Number(banStats.banned) / Number(banStats.total_accounts)
      : 0;
      
    const system_latency = latencyStats.avg_latency || 200;

    // Insert these metrics into slo_metrics
    await db.query(`
      INSERT INTO slo_metrics (name, value) 
      VALUES 
        ('reply_rate', $1),
        ('delivery_rate', $2),
        ('ban_rate', $3),
        ('system_latency', $4)
    `, [reply_rate, delivery_rate, ban_rate, system_latency]);

    const targetsRes = await db.query('SELECT * FROM slo_targets');
    const targets = targetsRes.rows;

    for (const target of targets) {
      // Get the latest metric
      const metricRes = await db.query('SELECT value FROM slo_metrics WHERE name = $1 ORDER BY timestamp DESC LIMIT 1', [target.name]);
      if (metricRes.rows.length === 0) continue;
      
      const currentValue = metricRes.rows[0].value;
      
      let isBreach = false;
      // Depending on the metric, what is a breach?
      if (target.name === 'reply_rate' || target.name === 'delivery_rate') {
        if (currentValue < target.critical_threshold) isBreach = true;
      } else if (target.name === 'ban_rate' || target.name === 'system_latency') {
        if (currentValue > target.critical_threshold) isBreach = true;
      }

      if (isBreach) {
        logger.warn({ type: 'slo_breach', message: `SLO Breach: ${target.name} = ${currentValue} (threshold: ${target.critical_threshold})`});
        
        // Ensure we don't spam incidents for the same SLO
        const recentIncidentRes = await db.query(`
          SELECT 1 FROM incidents 
          WHERE status = 'ACTIVE' AND root_cause LIKE $1
        `, [`%${target.name}%`]);

        if (recentIncidentRes.rows.length === 0) {
           await createIncident({
             root_cause: `Нарушение SLO (SLO Breach): ${target.name} пересек критическую границу (Критично: ${target.critical_threshold}, Текущее: ${currentValue})`,
             confidence: 0.95,
             slo_impact: Math.abs(currentValue - target.target_value), // roughly
             suggested_actions: getActionsForSLO(target.name)
           });
        }
      } else {
        // Predictive check
        const historyRes = await db.query(`
          SELECT value FROM slo_metrics 
          WHERE name = $1 
          ORDER BY timestamp DESC LIMIT 5
        `, [target.name]);
        
        if (historyRes.rows.length === 5) {
           const values = historyRes.rows.map(r => r.value);
           const slope = values[0] - values[4]; // rough slope (newest - oldest)
           let isPredictiveBreach = false;
           
           if ((target.name === 'reply_rate' || target.name === 'delivery_rate') && slope < -0.05 && (currentValue + slope) < target.critical_threshold) {
               isPredictiveBreach = true;
           } else if ((target.name === 'ban_rate' && slope > 0.05 && (currentValue + slope) > target.critical_threshold) || 
                      (target.name === 'system_latency' && slope > 100 && (currentValue + slope) > target.critical_threshold)) {
               isPredictiveBreach = true;
           }

           if (isPredictiveBreach) {
               const recentPredictiveRes = await db.query(`
                 SELECT 1 FROM incidents 
                 WHERE status = 'ACTIVE' AND root_cause LIKE $1
               `, [`%Predictive Breach: ${target.name}%`]);
               
               if (recentPredictiveRes.rows.length === 0) {
                  await createIncident({
                    root_cause: `Предиктивная угроза (Predictive Breach): ${target.name} стремительно падает. Скоро может пробить допустимый лимит (SLO).`,
                    confidence: 0.85,
                    slo_impact: Math.abs((currentValue + slope) - target.target_value),
                    suggested_actions: getActionsForSLO(target.name).map(a => ({...a, description: 'ПРЕЭМПТИВНО: ' + a.description}))
                  });
               }
           }
        }
      }
    }
  } catch(e: any) {
    logger.error({ type: 'slo', message: `SLO Check failed: ${e.message}` });
  }
}

function getActionsForSLO(metricName: string) {
  if (metricName === 'reply_rate') {
    return [
      {
        action_type: 'change_strategy',
        description: 'Изменить стратегию сообщений на более интерактивные варианты (A/B тест).',
        risk_level: 'medium' as const,
        confidence: 0.85
      },
      {
        action_type: 'pause_unresponsive',
        description: 'Приостановить рассылку холодным лидам для повышения общей конверсии.',
        risk_level: 'low' as const,
        confidence: 0.9
      }
    ];
  }
  if (metricName === 'ban_rate') {
    return [
      {
        action_type: 'reduce_throughput',
        description: 'Снизить глобальные лимиты скорости на 50% немедленно.',
        risk_level: 'low' as const,
        confidence: 0.95
      },
      {
        action_type: 'sleep_accounts',
        description: 'Перевести новые аккаунты (< 7 дней) в спящий режим.',
        risk_level: 'high' as const,
        confidence: 0.78
      }
    ];
  }
  if (metricName === 'system_latency') {
    return [
      {
         action_type: 'scale_workers',
         description: 'Увеличить размер пула воркеров (+20%).',
         risk_level: 'low' as const,
         confidence: 0.95
      }
    ];
  }
  return [];
}
