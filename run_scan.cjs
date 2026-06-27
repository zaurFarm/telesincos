require('dotenv').config({ path: '/var/www/telesincos/.env' });
process.env.ROLE = 'cron'; // чтобы db.query сразу резолвил контекст, если нужен
const { TelegramMarketScanner } = require('./dist/server.cjs').TelegramMarketScanner || {};
