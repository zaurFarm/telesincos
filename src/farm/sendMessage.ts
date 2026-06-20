import { getAvailableAccount, incrementUsage, getActionCountToday } from './accountManager.js';
import { getClient } from './clientPool.js';
import { db as pool } from '../db.js';
import { humanizeText, splitMessage, cleanBotText } from '../antiban/humanize.js';
import { getTypingDelay, decideResponseType } from '../antiban/behavior.js';
import { generateVoice, generateVideoNote } from '../utils/media.js';
import { Api } from "telegram";
import fs from 'fs';
import { MTProtoTelemetryAdapter } from '../system/telemetry/MTProtoTelemetryAdapter.js';

export async function sendMessageSmart(chatId: string, text: string, specificAccountId?: number) {
  const actionsToday = await getActionCountToday();
  if (actionsToday > 80) {
      console.log('🛡️ Anti-ban: Global action limit reached (80)');
      return;
  }

  let account;
  if (specificAccountId) {
    // For specific account selection driven by AI Dispatcher (Router)
    // We already fetch it so we just need the full object or we can get it from pool
    const accRes = await pool.query('SELECT * FROM farm_accounts WHERE id = $1', [specificAccountId]);
    account = accRes.rows[0];
  } else {
    // Old explicit fallback
    account = await getAvailableAccount();
  }

  if (!account) {
    console.log('Нет доступных аккаунтов');
    return;
  }

  if (account.warmup_stage < 4 && !specificAccountId) {
    console.log('Аккаунт еще не прогрет');
    return;
  }

  const client = await getClient(account);

  const profile = account.behavior_profile;

  const cleanedText = cleanBotText(text);
  const parts = splitMessage(cleanedText);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const finalPart = humanizeText(part, profile);
    const delay = getTypingDelay(finalPart, profile?.typingSpeed);
    
    // Последнее сообщение может быть отправлено как voice/video
    let type = 'text';
    if (i === parts.length - 1 && finalPart.length > 10) {
      type = decideResponseType(profile);
    }

    try {
        let action: any = new Api.SendMessageTypingAction();
        if (type === 'voice') action = new Api.SendMessageRecordAudioAction();
        if (type === 'video') action = new Api.SendMessageRecordRoundAction();

        await client.invoke(new Api.messages.SetTyping({
            peer: chatId,
            action: action
        }));
    } catch(e: any) { console.debug("[sendMessage] typing action failed:", e?.message); }

    await new Promise(res => setTimeout(res, delay));
    
    try {
      const startTime = Date.now();
      if (type === 'text') {
        await client.sendMessage(chatId, { message: finalPart });
      } else if (type === 'voice') {
        const voicePath = `voice_${account.id}_${Date.now()}.mp3`;
        await generateVoice(finalPart, 'female_soft', voicePath);
        await client.sendFile(chatId, { file: voicePath, voiceNote: true });
        if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
      } else if (type === 'video') {
        const voicePath = `voice_v_${account.id}_${Date.now()}.mp3`;
        const videoPath = `video_${account.id}_${Date.now()}.mp4`;
        await generateVoice(finalPart, 'female_soft', voicePath);
        await generateVideoNote(voicePath, account.id, videoPath);
        await client.sendFile(chatId, { file: videoPath, videoNote: true });
        if (fs.existsSync(voicePath)) fs.unlinkSync(voicePath);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
      const latency = Date.now() - startTime;
      MTProtoTelemetryAdapter.trackRpcLatency('sendMessage', latency);
      MTProtoTelemetryAdapter.trackSuccess(chatId);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('flood')) {
        MTProtoTelemetryAdapter.trackFloodWait('sendMessage', parseInt(e.seconds || e.message.match(/\d+/) || 30));
      } else {
        MTProtoTelemetryAdapter.trackRpcError('sendMessage', e.message, chatId);
      }
      throw e;
    }
  }

  await incrementUsage(account.id);
}

export async function sendWithFallback(chatId: string, text: string) {
  try {
    await sendMessageSmart(chatId, text);
  } catch (e) {
    console.log('Ошибка аккаунта, пробуем другой', e);
  }
}