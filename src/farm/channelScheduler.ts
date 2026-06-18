import { Api } from "telegram";

let createdToday = 0;

export async function createChannelsDaily(client: any) {
  if (createdToday >= 2) return null;

  const name = generateName();
  const desc = generateDescription();

  try {
    const result = await client.invoke(new Api.channels.CreateChannel({
      title: name,
      about: desc,
      megagroup: false
    }));

    const channel = result.chats[0];

    createdToday++;
    console.log(`✅ Created channel: ${name} (${channel.id})`);
    return channel;
  } catch (e: any) {
    console.error("Failed to create channel", e.message);
    return null;
  }
}

function generateName() {
  const names = [
    'Vape Shop Moscow',
    'Дым Маркет',
    'Vape Store 24',
    'Никотин Маркет',
    'Электронки МСК',
    'Vape Cloud RU'
  ];
  return names[Math.floor(Math.random() * names.length)];
}

function generateDescription() {
  const descs = [
    'Лучшие цены на вейпы в Москве. Доставка и самовывоз.',
    'Оригинальная продукция. Только 18+.',
    'Магазин электронок. Пишите в ЛС для заказа.',
    'Тут можно заказать жидкость и устройства.'
  ];
  return descs[Math.floor(Math.random() * descs.length)];
}
