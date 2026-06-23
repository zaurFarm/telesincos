const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
require('dotenv').config({ path: '/var/www/telesincos/.env' });

(async () => {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  const session = new StringSession('');
  const client = new TelegramClient(session, apiId, apiHash, { connectionRetries: 5 });
  await client.start({
    phoneNumber: async () => process.env.PHONE,
    password: async () => await input.text('2FA пароль (если есть, иначе Enter): '),
    phoneCode: async () => await input.text('Код из Telegram: '),
    onError: (err) => console.log('ERR:', err),
  });
  console.log('\n✅ Успешный вход!');
  console.log('SESSION=' + client.session.save());
  await client.disconnect();
  process.exit(0);
})();
