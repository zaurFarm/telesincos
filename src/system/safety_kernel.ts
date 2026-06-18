import { db } from '../db.js';
import { RuntimeKillSwitch } from './operations.js';

// STAGE 30 - Autonomous Safety Kernel

export class SafetyKernel {
    static async enforceHardLimits() {
         const limits = await this.getHardLimits();
         for (const limit of limits) {
             if (limit.current_value >= limit.max_value) {
                 await RuntimeKillSwitch.engage(`HARD LIMIT EXCEEDED: ${limit.limit_name}`, 'ALL');
             }
         }
    }

    static async getHardLimits(): Promise<any[]> {
         const { rows } = await db.query(`SELECT * FROM safety_hard_limits`);
         // If none populated, inject minimal defaults for runtime crash safety
         if (rows.length === 0) {
             return [
                 { limit_name: 'max_daily_spend', max_value: 50, current_value: 0 },
                 { limit_name: 'max_autopost_per_hour', max_value: 200, current_value: 0 }
             ];
         }
         return rows;
    }
    
    static async isOverrideActive(): Promise<boolean> {
         // Determines if a human operator has triggered a forced emergency bypass of all autonomy layers
         const isKilled = await RuntimeKillSwitch.isEngaged('ALL');
         return isKilled; // Returning kill-switch status as override authority
    }
}
