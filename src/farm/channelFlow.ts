import { getAvailableAccount } from './accountManager.js';
import { getClient } from './clientPool.js';
import { createChannelWithRole, getNetworkChannels } from './channelNetwork.js';
import { repostMessage } from '../telegram/repost.js';
import { addCTA } from '../ai/cta.js';
import { Api } from "telegram";

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const MAIN_CHANNEL_ID = process.env.MAIN_CHANNEL_ID || 'main_vape_channel_123';

export async function cascadePost(client: any, mainPostId: number) {
  const network = await getNetworkChannels();
  const showcases = network.filter(c => c.type === 'showcase');
  const micros = network.filter(c => c.type === 'micro');

  console.log(`Cascading post ${mainPostId} to ${showcases.length} showcases and ${micros.length} micros.`);

  // main → showcase
  for (const ch of showcases) {
    await sleep(random(10, 40) * 60 * 1000); // 10-40 min delay
    await repostMessage(client, MAIN_CHANNEL_ID, ch.id, mainPostId);
  }

  // showcase → micro
  for (const ch of micros) {
    let parentId = ch.parent;
    if (!parentId) {
      const parent = showcases[Math.floor(Math.random() * showcases.length)];
      if (parent) parentId = parent.id;
    }

    if (parentId) {
      await sleep(random(20, 60) * 60 * 1000); // 20-60 min delay
      await repostMessage(client, parentId, ch.id, mainPostId);
    }
  }
}

export async function createMainPost(client: any): Promise<number | null> {
    try {
        const text = await generateProductText();
        const finalMessage = addCTA(text);
        const result: any = await client.sendMessage(MAIN_CHANNEL_ID, { message: finalMessage });
        console.log(`📝 Created main post with ID: ${result.id}`);
        return result.id;
    } catch(e) {
        console.error("Failed to create main post", e);
        return null;
    }
}

async function generateProductText() {
    const products = [
        "🔥 ElfBar BC5000: Малина Арбуз. Насыщенный вкус.\nЦена: 900 руб.",
        "Новое поступление HQD Cuvie Plus. Более 20 вкусов.\nРозница и опт.",
        "Жидкости Brusko и Husky в наличии. Крепость 2% и 5%."
    ];
    return products[Math.floor(Math.random() * products.length)];
}

export async function runChannelFlow() {
  const account = await getAvailableAccount();
  if (!account) return;

  if (account.warmup_stage < 4) {
      console.log('🛡️ Anti-ban: Account is too young to participate in channel network.')
      return;
  }

  const client = await getClient(account);

  // 1. Создать витрину или микро-канал с шансом 1 к 3
  const role = Math.random() < 0.33 ? 'showcase' : 'micro';
  console.log(`🤖 Planning to create new ${role} channel...`);
  
  // Мы создаем их, но делаем лимиты, не больше 1 в день на аккаунт.
  await createChannelWithRole(client, account.id, role);

  // 2. Подождать 30-120 минут
  console.log(`⏳ Waiting for warmup before posting...`);
  await sleep(random(30, 120) * 60 * 1000);

  // 3. Создаем главный продающий пост
  const postId = await createMainPost(client);

  if (postId) {
    // 4. Разгоняем пост по сетке
    await cascadePost(client, postId);
  }
}

