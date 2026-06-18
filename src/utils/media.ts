import fs from 'fs';

// Mock generation functions instead of real heavy dependencies
// In actual production, this would use an API like ElevenLabs or a local Edge TTS server.
export async function generateVoice(text: string, voiceType: string, filePath: string) {
  // Simulate API delay
  await new Promise(res => setTimeout(res, 1000 + Math.random() * 2000));
  
  // Create a dummy mp3 file if it doesn't exist, otherwise we just touch it
  if (!fs.existsSync('dummy.mp3')) {
      fs.writeFileSync(filePath, Buffer.from([]));
  } else {
      fs.copyFileSync('dummy.mp3', filePath);
  }
}

// Mock video generation
// Real production uses fluent-ffmpeg to blend a static image + audio into a small mp4 circle.
export async function generateVideoNote(audioPath: string, accountId: number, outputPath: string) {
  // Simulate rendering delay
  await new Promise(res => setTimeout(res, 2000 + Math.random() * 3000));
  
  // Creates a dummy file
  if (!fs.existsSync('dummy.mp4')) {
      fs.writeFileSync(outputPath, Buffer.from([]));
  } else {
      fs.copyFileSync('dummy.mp4', outputPath);
  }
}
