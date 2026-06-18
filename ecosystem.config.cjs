module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/server.cjs',
      autorestart: true,
      max_memory_restart: '700M',
      wait_ready: true,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        APP_PORT: '3100'
      }
    },
    {
      name: 'workers',
      script: './dist/apps/workers/index.cjs',
      autorestart: true,
      max_memory_restart: '1200M',
      wait_ready: true,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        IS_WORKER: 'true'
      }
    },
    {
      name: 'cron',
      script: './dist/apps/cron/index.cjs',
      autorestart: true,
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'monitor',
      script: './dist/apps/monitor/index.cjs',
      autorestart: true,
      env: { NODE_ENV: 'production' }
    }
  ]
};
