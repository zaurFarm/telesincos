export function getLimitsByStage(stage: number) {
  switch (stage) {
    case 1:
      return { messages: 0, joins: 1 };
    case 2:
      return { messages: 2, joins: 2 };
    case 3:
      return { messages: 5, joins: 3 };
    case 4:
      return { messages: 20, joins: 5 };
    default:
      return { messages: 0, joins: 0 };
  }
}