import express from 'express';

export class ProxyAwareness {
  static apply(app: express.Application) {
    // In production, we are likely behind Nginx or a cloud load balancer
    // We trust loopback and local networks directly behind 1 proxy
    app.set('trust proxy', 1);
  }
}
