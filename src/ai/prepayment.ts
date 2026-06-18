export function generatePrepaymentMessage(type: 'trusted' | 'new') {
  if (type === 'trusted') {
    return 'можешь сразу перевести, подготовлю';
  }

  return 'если переживаешь, можем частично или через самовывоз на тяк';
}
