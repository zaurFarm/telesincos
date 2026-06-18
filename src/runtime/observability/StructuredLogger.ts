export class StructuredLogger {
    static info(message: string, context?: any) {
        console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message, context }));
    }
    
    static warn(message: string, context?: any) {
        console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message, context }));
    }
    
    static error(message: string, error?: any, context?: any) {
        console.error(JSON.stringify({ 
            level: 'ERROR', 
            timestamp: new Date().toISOString(), 
            message, 
            error: error?.message || error,
            stack: error?.stack,
            context 
        }));
    }
    
    static debug(message: string, context?: any) {
        if (process.env.DEBUG) {
            console.debug(JSON.stringify({ level: 'DEBUG', timestamp: new Date().toISOString(), message, context }));
        }
    }
}
