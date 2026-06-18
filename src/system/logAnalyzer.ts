import { db } from '../db.js';
import { generateJSON } from '../ai/provider.js';
import { createIncident } from './incidentManager.js';
import { logger } from './logger.js';

interface LogEntry {
  level: string;
  type: string;
  account_id: string | null;
  message: string;
  metadata: any;
  created_at: string;
}

export async function runLogAnalyzer() {
  try {
    // 1. Fetch recent traces with errors/bans
    const res = await db.query(`
      WITH problem_traces AS (
        SELECT metadata->>'traceId' as trace_id
        FROM system_logs 
        WHERE created_at > NOW() - INTERVAL '15 minutes'
        AND level IN ('warn', 'error', 'fatal')
        AND metadata->>'traceId' IS NOT NULL
        GROUP BY 1
        LIMIT 50
      )
      SELECT 
        l.metadata->>'traceId' as trace_id,
        l.metadata->>'spanId' as span_id,
        l.metadata->>'step' as step,
        l.level, l.type, l.account_id, l.message, l.metadata, l.created_at 
      FROM system_logs l
      JOIN problem_traces pt ON l.metadata->>'traceId' = pt.trace_id
      ORDER BY l.created_at ASC
    `);

    const logs: any[] = res.rows;
    if (logs.length === 0) return;

    // Group by trace
    const traces: Record<string, any[]> = {};
    for (const row of logs) {
      if (!traces[row.trace_id]) traces[row.trace_id] = [];
      traces[row.trace_id].push(row);
    }

    const flatLogs = logs; // fallback for basic analysis counts
    const bans = flatLogs.filter(l => l.type === 'ban' || l.message.toLowerCase().includes('ban') || l.message.includes('FLOOD_WAIT'));
    const errors = flatLogs.filter(l => l.level === 'error' || l.level === 'fatal');

    logger.info({
      type: 'log_analysis',
      message: `Analyzing ${Object.keys(traces).length} problematic traces`,
      banCount: bans.length,
      errorCount: errors.length
    });

    let anomalyDetected = false;
    let anomalyReason = '';

    if (bans.length > 5) {
      anomalyDetected = true;
      anomalyReason = 'BAN_SPIKE';
    } else if (errors.length > 20) {
      anomalyDetected = true;
      anomalyReason = 'ERROR_SURGE';
    }

    if (!anomalyDetected && Object.keys(traces).length < 20) {
      // Nothing major to analyze
      return;
    }

    // 3. AI Insight generation (Group and analyze)
    const traceText = Object.values(traces).map(trace => {
      let t = `TRACE ID: ${trace[0].trace_id}\n`;
      trace.forEach(span => {
        t += `  -> [${span.step || span.type}] ${span.level.toUpperCase()} Acc:${span.account_id} : ${span.message} | Meta: ${JSON.stringify(span.metadata)}\n`;
      });
      return t;
    }).join('\n---\n');

    const prompt = `You are an SRE AI analyzing distributed trace chains. We detected an anomaly: ${anomalyReason}.
Here are the recent problematic trace chains:
${traceText.substring(0, 10000)}

Analyze these causal chains. Group them by root cause. Provide an insight JSON with the following structure:
{
  "issues": [
    {
      "issueTitle": "Brief description of the problem",
      "rootCause": "Why is this happening based on the causal chain",
      "step": "Which step in the trace is failing",
      "previousStep": "What was the step that led to this",
      "confidence": 0.9,
      "suggestion": "Actionable recommendation to fix",
      "flaggedPatterns": ["pattern1", "pattern2"]
    }
  ]
}

Only return valid JSON. Do not return markdown if possible.`;

    const analysis = await generateJSON(prompt);

    if (analysis && analysis.issues && analysis.issues.length > 0) {
      for (const issue of analysis.issues) {
        if (issue.confidence > 0.7) {
          // 4. Incident Center Integration
          createIncident({
            root_cause: `${issue.issueTitle}: ${issue.rootCause}`,
            confidence: issue.confidence || 0.8,
            slo_impact: 0.1,
            suggested_actions: [
              {
                action_type: 'human_review',
                description: issue.suggestion,
                risk_level: 'low',
                confidence: issue.confidence || 0.8
              }
            ]
          });
          
          logger.warn({
            type: 'ai_detected_issue',
            message: issue.issueTitle,
            insight: issue
          });

          // 5. Auto-learning (correlation)
          if (issue.flaggedPatterns && issue.flaggedPatterns.length > 0) {
             for(const pattern of issue.flaggedPatterns) {
                // If it's a message pattern causing bans, add to blacklist
                if (anomalyReason === 'BAN_SPIKE') {
                  logger.info({
                    type: 'auto_learning',
                    message: 'Adding pattern to blacklist based on ban correlation',
                    pattern
                  });
                  // Example: await db.query('INSERT INTO global_blacklist (pattern) VALUES ($1) ON CONFLICT DO NOTHING', [pattern]);
                }
             }
          }
        }
      }
    }

  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED' && !error.message?.includes('ECONNREFUSED')) {
      logger.error({
        type: 'log_analyzer_failure',
        message: error.message
      });
    }
  }
}
