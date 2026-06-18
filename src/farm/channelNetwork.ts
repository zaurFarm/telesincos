import { Api } from "telegram";
import { db as pool } from '../db.js';

export type ChannelRole = 'main' | 'showcase' | 'micro';

export interface ChannelNode {
  id: string;
  type: ChannelRole;
  parent?: string;
  title: string;
}

export async function createChannelWithRole(client: any, accountId: number, role: ChannelRole, parentId?: string) {
  const name = generateNameByRole(role);
  const desc = generateDescription(role);

  try {
    const result = await client.invoke(new Api.channels.CreateChannel({
      title: name,
      about: desc,
      megagroup: false
    }));

    const channel = result.chats[0];

    // Сохраняем в базу маршрутов и каналов
    await pool.query(
      `INSERT INTO farm_channels (account_id, channel_id, username, title, type, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [accountId, channel.id.toString(), channel.username || '', name, role, parentId || null]
    );

    console.log(`✅ Created ${role} channel: ${name} (${channel.id})`);
    return channel;
  } catch (e: any) {
    console.error(`Failed to create ${role} channel`, e.message);
    return null;
  }
}

function generateNameByRole(role: ChannelRole) {
  if (role === 'showcase') {
    const showcases = [
      'Vape Store Moscow',
      'Оригинальные Вейпы',
      'Парилка Мск',
      'Никотин Шоп',
      'Электронки Premium'
    ];
    return showcases[Math.floor(Math.random() * showcases.length)];
  }

  if (role === 'micro') {
    const micros = [
      'дым сегодня',
      'вейп на районе',
      'smoke msk',
      'электронки тут',
      'где купить вейп',
      'hqd elfbar мск'
    ];
    return micros[Math.floor(Math.random() * micros.length)];
  }

  return 'Official Vape Channel';
}

function generateDescription(role: ChannelRole) {
  if (role === 'showcase') {
    return 'Шоурум и доставка электронок. 18+.\nОригинал, гарантия.';
  }
  return 'Наличие на сегодня. Пишите в ЛС.';
}

export async function getNetworkChannels(): Promise<ChannelNode[]> {
  const res = await pool.query('SELECT channel_id, type, parent_id, title FROM farm_channels');
  return res.rows.map(r => ({
    id: r.channel_id,
    type: r.type as ChannelRole,
    parent: r.parent_id,
    title: r.title
  }));
}
