import { scoreMessage } from '../ai/scoring.js';

export function isPotentialLead(text: string) {
  const triggers = [
    "ищу",
    "куплю",
    "нужен",
    "где взять",
    "посоветуйте",
    "сколько стоит"
  ];

  return triggers.some(t => text.toLowerCase().includes(t));
}

export async function scoreLead(text: string) {
  if (!isPotentialLead(text)) {
    return { isLead: false, confidence: 0, intent: 'none', temperature: 'cold' };
  }
  
  return await scoreMessage(text);
}