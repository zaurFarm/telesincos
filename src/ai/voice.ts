import type { Emotion } from './emotion.js';

// Example wrapper for ElevenLabs voice generation

/**
 * Mocks or wraps voice generation for Telegram voice notes
 */
export async function generateVoice(text: string, emotion: Emotion = 'neutral'): Promise<Buffer | null> {
  // To actualize this, you would add your ElevenLabs API Key
  // and use the axios call provided in the masterplan
  
  let stability = 0.5;
  let styleExaggeration = 0.0;
  let useSpeakerBoost = true;

  switch (emotion) {
    case 'excited':
      stability = 0.3; // More dynamic, faster, expressive
      styleExaggeration = 0.4;
      break;
    case 'tired':
      stability = 0.8; // Flat, slow, low energy
      styleExaggeration = 0.0;
      break;
    case 'annoyed':
      stability = 0.7; // Cold, steady, clipped
      styleExaggeration = 0.6; // Push the annoyed style
      break;
    case 'friendly':
    case 'warm':
      stability = 0.4; // Melodic, kind
      styleExaggeration = 0.2;
      break;
    default:
      stability = 0.5;
      styleExaggeration = 0.0;
  }

  /*
  import axios from 'axios';
  
  if (!process.env.ELEVEN_API_KEY) return null;
  
  try {
    const res = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: stability,
          similarity_boost: 0.75,
          style: styleExaggeration,
          use_speaker_boost: useSpeakerBoost
        }
      },
      {
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );
    return Buffer.from(res.data);
  } catch (e) {
    console.error("Failed to generate voice:", e);
    return null;
  }
  */

  console.log(`[VOICE MOCK] Would generate voice note. Emotion: ${emotion}, Stability: ${stability}, Style: ${styleExaggeration}. Text:`, text);
  return null; // Fallback to text in userbot.ts if null
}

export async function generateVideoNote(text: string): Promise<Buffer | null> {
  // Dummy function for ffmpeg / HeyGen logic 
  console.log("[VIDEO MOCK] Would generate video note for text:", text);
  return null;
}
