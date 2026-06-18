export function analyzeBehavior(messages: any[]) {
  let delays: number[] = [];
  let replies = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    if (prev.role === 'user' && curr.role === 'assistant') {
      replies++;
      delays.push(new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime());
    }
  }

  const avgDelay = delays.length
    ? delays.reduce((a, b) => a + b, 0) / delays.length
    : 3000;

  return {
    avg_reply_delay: avgDelay,
    reply_probability: messages.length ? replies / messages.length : 1,
    followup_probability: 0.3,
    aggression_level: messages.filter(m => m.text && m.text.includes('не могу')).length / Math.max(1, messages.length),
    persistence_level: messages.filter(m => m.text && m.text.includes('актуально')).length / Math.max(1, messages.length)
  };
}

export function shouldReply(behavior: any) {
  if (!behavior) return true;
  return Math.random() < (behavior.reply_probability || 1);
}

export function getHumanDelay(behavior: any) {
  const base = behavior?.avg_reply_delay || 3000;
  const jitter = Math.random() * 2000;
  return base + jitter;
}

export function getBehaviorType(profile: any) {
  if (!profile) return 'normal';
  if (profile.aggression_level > 0.6) return 'aggressive';
  if (profile.persistence_level > 0.6) return 'pushy';
  return 'normal';
}
