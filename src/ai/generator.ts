import { Strategy } from './strategy.js';

export function generateByStrategy(strategy: Strategy, base: string): string {
  switch (strategy) {
    case 'hook':
      return `${base}\n\nчто примерно ищешь?`;

    case 'clarify':
      return `${base}\n\nсколько нужно?`;

    case 'close':
      return `можешь перевести — подготовлю\nсразу заберешь`;

    case 'push':
      return `смотри, норм варианты быстро уходят\nесли что могу отложить`;

    case 'soft_exit':
      return `ок, если что — напиши 👍`;

    case 'filter':
      return `не актуально`;

    case 'delay':
      return `чуть позже отпишу`;

    default:
      return base;
  }
}
