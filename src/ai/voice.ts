import type { Emotion } from './emotion.js';

export async function generateVoice(text: string, emotion: Emotion = 'neutral'): Promise<Buffer | null> {
  if (!process.env.ELEVEN_API_KEY || !process.env.ELEVEN_VOICE_ID) {
    console.debug('[voice] disabled (ELEVEN_API_KEY/ELEVEN_VOICE_ID not set) — falling back to text');
    return null;
  }
  let stability = 0.5, styleExaggeration = 0.0;
  const useSpeakerBoost = true;
  switch (emotion) {
    case 'excited':  stability = 0.3; styleExaggeration = 0.4; break;
    case 'tired':    stability = 0.8; styleExaggeration = 0.0; break;
    case 'annoyed':  stability = 0.7; styleExaggeration = 0.6; break;
    case 'friendly':
    case 'warm':     stability = 0.4; styleExaggeration = 0.2; break;
    default:         stability = 0.5; styleExaggeration = 0.0;
  }
  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_VOICE_ID}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVEN_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability, similarity_boost: 0.75, style: styleExaggeration, use_speaker_boost: useSpeakerBoost },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) { console.error('[voice] generation failed: HTTP', res.status); return null; }
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    console.error('[voice] generation failed:', e?.message);
    return null;
  }
}

export async function generateVideoNote(_text: string): Promise<Buffer | null> {
  console.debug('[video] not implemented — falling back to text');
  return null;
}
