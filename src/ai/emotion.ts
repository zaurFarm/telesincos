export type Emotion =
  | "neutral"
  | "friendly"
  | "excited"
  | "tired"
  | "annoyed"
  | "warm";

export function detectEmotion(context: any, relationship: any, memoryBias: string | null = null) {
  let baseEmotion: Emotion = "neutral";
  
  if (relationship.type === "buyer") baseEmotion = "excited";
  else if (relationship.type === "risky") baseEmotion = "annoyed";
  else if (context && context.length > 15) baseEmotion = "tired";
  else if (relationship.type === "trusted") baseEmotion = "friendly";
  
  // Use memory bias if present and not neutral, otherwise default
  if (memoryBias && memoryBias !== "neutral") {
      baseEmotion = memoryBias as Emotion;
  }

  return baseEmotion;
}

export function getEmotionModifiers(emotion: Emotion) {
  switch (emotion) {
    case "friendly":
    case "warm":
      return {
        emoji: true,
        typos: false,
        delay: [5, 10],
      };

    case "excited":
      return {
        emoji: true,
        typos: false,
        delay: [3, 6],
      };

    case "tired":
      return {
        emoji: false,
        typos: true,
        delay: [15, 30],
        short: true
      };

    case "annoyed":
      return {
        emoji: false,
        typos: false,
        delay: [2, 5],
        short: true
      };

    default: // neutral
      return {
        emoji: false,
        typos: false,
        delay: [8, 15],
      };
  }
}

export function applyEmotion(text: string, emotionConfig: any) {
  let result = text;

  // Sometimes cut the response short for 'tired' or 'annoyed'
  if (emotionConfig.short && Math.random() > 0.5) {
    const parts = result.split(/[\.\!\?]/);
    if (parts.length > 0 && parts[0].trim().length > 0) {
      result = parts[0].trim();
    }
  }

  if (emotionConfig.typos && Math.random() > 0.7) {
    // Simple simulation of typo
    result = result.replace(/е/g, 'э').replace(/и/g, 'й');
  }

  if (emotionConfig.emoji && Math.random() > 0.5) {
      const positiveEmojis = ["🙂", "👍", "👌", "🔥"];
      result += " " + positiveEmojis[Math.floor(Math.random() * positiveEmojis.length)];
  }

  return result;
}
