import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const clients: Record<number, TelegramClient> = {};

export async function getClient(account: any) {
  if (clients[account.id]) {
    return clients[account.id];
  }

  let proxyConfig = undefined;

  const proxyString = account.proxy || account.proxy_id;

  // Modern Proxy parsing if we pass proxy url inside proxy field
  if (proxyString && proxyString.includes('://')) {
      try {
          const u = new URL(proxyString);
          if (u.protocol.includes('socks5') || u.protocol.includes('http')) {
              proxyConfig = {
                  ip: u.hostname,
                  port: parseInt(u.port),
                  socksType: u.protocol.includes('socks5') ? 5 : undefined,
                  username: u.username || undefined,
                  password: u.password || undefined
              };
          }
      } catch (e: any) { console.debug("[clientPool] proxy parse failed:", e?.message); }
  } else if (account.proxy_ip) {
      proxyConfig = {
        ip: account.proxy_ip,
        port: account.proxy_port,
        socksType: 5,
        username: account.proxy_user,
        password: account.proxy_pass
      }
  }

  if (!process.env.API_ID || !process.env.API_HASH) {
    throw new Error('API_ID and API_HASH must be configured.');
  }

  const client = new TelegramClient(
    new StringSession(account.session),
    Number(process.env.API_ID),
    process.env.API_HASH,
    {
      connectionRetries: 5,
      deviceModel: account.device?.deviceModel || "Samsung Galaxy S21",
      systemVersion: account.device?.systemVersion || "Android 13",
      appVersion: account.device?.appVersion || "10.5.1",
      proxy: proxyConfig
    }
  );

  await client.connect();

  // Прогреваем кэш сущностей (entity cache) — без этого gramJS не может
  // отрезолвить чужой userId в Peer, если этот клиент ни разу не видел диалог.
  try {
    await client.getDialogs({ limit: 50 });
  } catch (e: any) {
    console.debug('[clientPool] getDialogs warmup failed:', e?.message);
  }

  clients[account.id] = client;

  return client;
}