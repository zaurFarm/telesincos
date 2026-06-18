import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function createEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    // @ts-ignore
    return response.embeddings[0].values;
  } catch(e) {
     console.error('Embedding failed', e);
     return null;
  }
}
