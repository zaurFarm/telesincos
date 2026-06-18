import { db } from '../db.js';
import { getSettings } from '../system/settings.js';
import { generateContent } from '../ai/provider.js';
import { AdaptivePublishingPolicy } from './reputation.js';
import { MeshExecutionGate } from '../system/mesh.js';

export async function runAutopost() {
  try {
    const settings: any = getSettings() || {};
    if (!settings.autoPostEnabled) return;

    const marketCondition = await AdaptivePublishingPolicy.evaluateMarketConditions();
    if (marketCondition.shouldThrottle && !settings.autoPostShadowMode) {
       console.log(`[AUTOPOST] Throttling active due to poor reputation / spam risk.`);
       if (Math.random() > 0.5) {
         console.log(`[AUTOPOST] Throttled (skipped) this cycle.`);
         return;
       }
    }

    const res = await db.query(`SELECT product_text, price FROM competitor_data ORDER BY created_at DESC LIMIT 20`);
    if (res.rows.length === 0) return;

    const deal = res.rows[Math.floor(Math.random() * res.rows.length)];
    const originalText = deal.product_text;

    if (settings.autoPostStopWords) {
       const stopWords = settings.autoPostStopWords.split(',').map((w: string) => w.trim().toLowerCase());
       const lowerText = originalText.toLowerCase();
       if (stopWords.some((w: string) => w && lowerText.includes(w))) {
         console.log(`[AUTOPOST] Skipped due to stop words: ${deal.product_text}`);
         return;
       }
    }

    let replacementsInstruction = "";
    if (settings.autoPostRemoveAds) {
       replacementsInstruction += "- Вырежи любую рекламу, ссылки на другие каналы и спам.\n";
    }
    if (settings.autoPostReplacePhone) {
       replacementsInstruction += `- Замени любые чужие номера телефонов на этот номер: ${settings.autoPostReplacePhone}\n`;
    }
    if (settings.autoPostReplaceLinks) {
       replacementsInstruction += `- Замени любые чужие @username или ссылки на: ${settings.autoPostReplaceLinks}\n`;
    }
    if (settings.autoPostTextReplacements) {
       replacementsInstruction += `- Словарь замен (ОБЯЗАТЕЛЬНО ЗАМЕНИ СЛОВА ИЗ ПЕРВОЙ ЧАСТИ ДЕФИСА НА ВТОРУЮ):\n${settings.autoPostTextReplacements}\n`;
    }
    if (settings.autoPostRules) {
       replacementsInstruction += `- Дополнительное правило: ${settings.autoPostRules}\n`;
    }

    let rewriteInstruction = "Ты менеджер магазина. Подготовь рекламный пост для Телеграм-канала о товаре.";
    if (settings.autoPostUniqualize) {
      rewriteInstruction = "Тебе дан конкурентный текст. Ты ОБЯЗАН полностью уникализировать (сделать глубокий рерайт) этот текст от лица нашего магазина так, чтобы он выглядел оригинально, привлекательно, и не читался как копия. Сохрани суть товара, но измени подачу полностью.";
    }

    const prompt = `${rewriteInstruction}
Товар для основы поста (оригинал): "${originalText}"
Оригинальная цена (СКРЫТЬ И ЗАИНТРИГОВАТЬ ЗАПРОСОМ В ЛС): ${deal.price || ''}

Обязательные требования:
${replacementsInstruction}
- НЕ ПИШИ конкретную цену и точные цифры! Пусть будет "выгодная цена".
- Призыв обращаться в ЛС (или по контактам) обязателен. Не перебарщивай с эмодзи.

Верни ТОЛЬКО готовый текст поста, никаких комментариев от себя.`;

    const postContent = await generateContent(prompt);

    const sourceCh = settings.autoPostSourceChannels ? settings.autoPostSourceChannels.split(',')[0].trim() : 'Auto-Scraper';
    const targetCh = settings.autoPostTargetChannel || 'Main Channel';

    const { PolicyValidator } = await import('./sanitization.js');
    const report = await PolicyValidator.validate(originalText, postContent);

    // Human Approval Only for High-Risk Cases (Settings can force this)
    const forceApproval = settings.autoPostRequireApproval === true;
    const shadowMode = settings.autoPostShadowMode === true;
    const shouldGoToQueue = !report.isSafe || forceApproval;

    if (shadowMode) {
      console.log(`[AUTOPOST][SHADOW] Would have published? ${!shouldGoToQueue}. Risk: ${report.riskScore}`);
      await db.query(`
        INSERT INTO pending_autoposts (original_text, proposed_text, source_channel, target_channel, status, risk_score, risk_reasons)
        VALUES ($1, $2, $3, $4, 'shadow', $5, $6)
      `, [originalText, report.sanitized, sourceCh, targetCh, report.riskScore, JSON.stringify(report.reasons)]);
    } else if (shouldGoToQueue) {
      await db.query(`
        INSERT INTO pending_autoposts (original_text, proposed_text, source_channel, target_channel, status, risk_score, risk_reasons)
        VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      `, [originalText, report.sanitized, sourceCh, targetCh, report.riskScore, JSON.stringify(report.reasons)]);
      console.log(`[AUTOPOST] Added to pending queue. Safe: ${report.isSafe}, Risk: ${report.riskScore}, Force: ${forceApproval}`);
    } else {
      console.log(`[AUTOPOST] Attempting Auto-publishing (Score: ${report.riskScore}) using PublishingAgent capability...`);
      
      // Enforce Governance using MeshExecutionGate
      await MeshExecutionGate.executeAction('PublishingAgent', 'dispatch_post', { content: report.sanitized }, async () => {
        await db.query(
          `INSERT INTO actions (type, chat, user_name, content, reason) VALUES ($1, $2, $3, $4, $5)`,
          ['autopost', targetCh, 'System', report.sanitized, 'auto_offer']
        );
        
        await db.query(`
          INSERT INTO pending_autoposts (original_text, proposed_text, source_channel, target_channel, status, risk_score, risk_reasons)
          VALUES ($1, $2, $3, $4, 'published', $5, $6)
        `, [originalText, report.sanitized, sourceCh, targetCh, report.riskScore, JSON.stringify(report.reasons)]);
      });
    }
  } catch (e) {
    console.error("Failed to run autopost", e);
  }
}
