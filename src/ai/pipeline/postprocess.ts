import { humanizeText } from '../../antiban/humanize.js';

function applyChaos(text: string, strategy: string) {
    let res = text;
    if (strategy === 'ask_price' || strategy === 'sell_price_accepted') {
        if (Math.random() > 0.7) res += " 🤝";
    }
    if (Math.random() > 0.8 && !text.endsWith("?")) {
        res += " 👌";
    }
    return res;
}

function splitMessage(text: string) {
  if (text.length < 40) return [text];
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter(p => p.trim().length > 0);
}

function applyBehaviorDelay(behavior: any, textLength: number) {
  const base = behavior?.avg_reply_delay || 2000;
  const jitter = Math.random() * 3000;
  // Also account for typing time so it isn't instant
  const typingTime = Math.min(textLength * 50, 4000);
  return Math.max(1500, base + jitter + typingTime);
}

function conversationalHumanize(text: string) {
  if (Math.random() < 0.2) {
    const prefixes = ["смотри, ", "кстати, ", "слушай, ", "если честно, "];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    // Ensure lowercase if we add prefix
    const lowered = text.charAt(0).toLowerCase() + text.slice(1);
    return prefix + lowered;
  }
  return text;
}

export async function postprocess(reply: string, state: any, decision: any) {
  let text = humanizeText(reply);
  text = applyChaos(text, decision.strategy);
  text = conversationalHumanize(text);

  // Anti-Degradation Guards
  const minResponseLength = 5;
  const maxResponseLength = 400; // stricter max

  if (text.length < minResponseLength) {
    console.log(`[GUARD] Text too short: "${text}". Adjusting fallback.`);
    // minimal fallback that adds value or prompts action
    text = text.trim() + " Рассказать подробнее?"; 
  }

  if (text.length > maxResponseLength) {
    console.log(`[GUARD] Text too long: ${text.length} chars. Trimming.`);
    text = text.slice(0, maxResponseLength).trim() + "..."; // guard to prevent massive walls of text
  }

  const parts = splitMessage(text);
  const baseDelay = decision.delay || applyBehaviorDelay(state.behavior, text.length);
  
  const messages = parts.map((part, index) => {
      const typingTime = Math.min(part.length * 50, 4000);
      const delay = index === 0 ? baseDelay : typingTime + Math.random() * 1500;
      return { text: part, delay, typingTime };
  });

  return {
    isSplit: messages.length > 1,
    messages,
    text: text,
    delay: Math.max(1500, baseDelay),
    meta: {
      strategy: decision.strategy
    }
  };
}
