import jwt from 'jsonwebtoken';

export class AuthBootstrap {
  static validateToken(token: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET must be configured');
    }
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  }

  static verifyAdminAccess(token: string) {
    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken) {
      throw new Error('ADMIN_TOKEN is required');
    }
    return token === expectedToken;
  }
}
