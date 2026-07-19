import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { db } from '../db.js';
import dotenv from 'dotenv';
dotenv.config();

const KEYWORDS = [
  'vape', 'вейп', 'электронные сигареты', 'hqd', 'puffmi', 'waka',
  'elf bar', 'elfbar', 'pod', 'снюс', 'табак опт', 'вейп опт',
  'одноразки', 'жидкость вейп', 'поставщик вейп', 'вейп оптом'
];

export async function autoJoinVapeChannels() {
  const client = new TelegramClient(
    new StringSession(process.env.SESSION || ''),
    Number(process.env.API_ID),
    process.env.API_HASH || '',
    { connectionRetries: 3 }
  );
  try {
    await client.connect();
    console.log('[AutoJoin] Connected');
    for (const keyword of KEYWORDS) {
      try {
        const result = await client.invoke(new Api.contacts.Search({ q: keyword, limit: 10 })) as any;
        const chats = result.chats || [];
        for (const chat of chats) {
          if (!chat.username) continue;
          try {
            const existing = await db.query('SELECT 1 FROM joined_channels WHERE channel_id = $1', [String(chat.id)]).catch(() => ({ rows: [] }));
            if (existing.rows.length > 0) continue;
            await client.invoke(new Api.channels.JoinChannel({ channel: chat.username }));
            await db.query('INSERT INTO joined_channels (channel_id, username, title) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [String(chat.id), chat.username, chat.title || '']).catch(() => {});
            console.log('[AutoJoin] Joined: @' + chat.username + ' (' + chat.title + ')');
            await new Promise(r => setTimeout(r, 4000 + Math.random() * 6000));
          } catch (e: any) {
            if (e.message && e.message.includes('FLOOD')) { console.log('[AutoJoin] Flood, stopping'); return; }
            console.debug('[AutoJoin] Skip ' + chat.username + ': ' + e.message);
          }
        }
        await new Promise(r => setTimeout(r, 5000));
      } catch (e: any) {
        console.debug('[AutoJoin] Search failed for "' + keyword + '": ' + e.message);
      }
    }
  } finally {
    await client.disconnect();
    console.log('[AutoJoin] Done');
  }
}
