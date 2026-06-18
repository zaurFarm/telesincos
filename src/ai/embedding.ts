import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: text,
    });
    return res.embeddings?.[0]?.values || [];
  } catch (e) {
    console.error("Embedding generation failed:", e);
    return [];
  }
}
