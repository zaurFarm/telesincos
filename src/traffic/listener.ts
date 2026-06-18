import { NewMessage } from "telegram/events/index.js";

export function startListening(client: any, onMessage: Function) {
  client.addEventHandler(async (event: any) => {
    const message = event.message;

    if (!message || !message.message) return;

    onMessage({
      text: message.message,
      chatId: message.peerId?.userId || message.peerId?.channelId || message.peerId?.chatId,
      userId: message.senderId
    });
  }, new NewMessage({}));
}