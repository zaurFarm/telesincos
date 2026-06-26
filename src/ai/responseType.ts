export function decideResponseType(stage: string): 'voice' | 'video' | 'text' {
  // Voice/video disabled: ElevenLabs (ELEVEN_API_KEY/ELEVEN_VOICE_ID) is not configured.
  // Always text until voice is properly set up — avoids sending invalid/empty media files.
  if (!process.env.ELEVEN_API_KEY || !process.env.ELEVEN_VOICE_ID) {
    return 'text';
  }
  if (stage === 'closing' || stage === 'ready') {
    if (Math.random() > 0.5) return 'voice';
  }
  const rand = Math.random();
  if (rand > 0.95) return 'video';
  if (rand > 0.85) return 'voice';
  return 'text';
}
