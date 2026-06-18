import express from 'express';

export class SecurityPolicy {
  static apply(app: express.Application) {
    app.set('trust proxy', 1);
    
    // Future expansion:
    // Helmet integration (if installed)
    // Rate limiters (to be imported from existing implementations)
    // CORS whitelisting (to replace general app.use(cors()))
    
    // Disable fingerprinting
    app.disable('x-powered-by');
    
    console.log('[Security] Core security policies applied.');
  }
}
