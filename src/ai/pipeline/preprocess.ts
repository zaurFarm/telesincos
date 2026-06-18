import { analyzeRisk } from '../risk.js';

export async function preprocess(input: any) {
  const risk = await analyzeRisk(input.text);

  if (risk.risk === 'high') {
    return { drop: true, risk };
  }

  return {
    drop: false,
    risk
  };
}
