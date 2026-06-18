export function getRandomDelay(): number {
  // 10–30 секунд
  return Math.floor(Math.random() * 20000) + 10000;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
