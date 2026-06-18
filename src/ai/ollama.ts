import { generateContent } from './provider.js';

/**
 * @deprecated Use generateContent from provider.js instead.
 */
export async function ollamaGenerate(prompt: string): Promise<string> {
  return generateContent(prompt);
}
