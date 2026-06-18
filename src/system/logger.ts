import pino from 'pino';
import { db } from '../db.js';
import { randomUUID } from 'crypto';
import { getContext } from './context.js';

export const pinoLogger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: null, // removes pid and hostname
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const logger = {
  async log(level: 'info' | 'warn' | 'error' | 'fatal', msgObj: any) {
    const ctx = getContext();
    const { type, message, accountId, chatId, traceId, spanId, parentSpanId, step, jobId, leadId, ...rest } = msgObj;
    
    const finalTraceId = traceId || ctx?.traceId || null;
    const finalJobId = jobId || ctx?.jobId || null;

    // Format for Pino
    const logData = {
      level,
      type: type || 'system',
      accountId: accountId || null,
      chatId: chatId || null,
      traceId: finalTraceId,
      jobId: finalJobId,
      leadId: leadId || null,
      spanId: spanId || null,
      parentSpanId: parentSpanId || null,
      step: step || null,
      tenantId: ctx?.tenantId || null,
      ...rest
    };

    if (level === 'info') pinoLogger.info(logData, message || '');
    if (level === 'warn') pinoLogger.warn(logData, message || '');
    if (level === 'error') pinoLogger.error(logData, message || '');
    if (level === 'fatal') pinoLogger.fatal(logData, message || '');

    // Still push to DB so the UI / our own log engine analyzer can query it easily if we want
    try {
      await db.query(`
        INSERT INTO system_logs (level, type, account_id, chat_id, message, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        level === 'fatal' ? 'error' : level, 
        type || 'system', 
        accountId || null, 
        chatId || null, 
        message || '', 
        JSON.stringify({ ...rest, traceId: logData.traceId, spanId: logData.spanId, parentSpanId: logData.parentSpanId, step: logData.step, jobId: logData.jobId, leadId: logData.leadId, tenantId: logData.tenantId })
      ]);
    } catch (e: any) {
       // We ignore DB insert errors on logging to prevent an infinite loop of logging failures
    }
  },

  info(msg: any) {
    return this.log('info', msg);
  },

  warn(msg: any) {
    return this.log('warn', msg);
  },

  error(msg: any) {
    return this.log('error', msg);
  },
  
  fatal(msg: any) {
    return this.log('fatal', msg);
  }
};

