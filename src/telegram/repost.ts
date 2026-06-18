import { Api } from "telegram";
import bigInt from "big-integer";

export async function repostMessage(client: any, fromChannel: string, toChannel: any, messageId: number) {
  try {
    await client.invoke(new Api.messages.ForwardMessages({
      fromPeer: fromChannel,
      id: [messageId],
      toPeer: toChannel,
      randomId: [bigInt(Math.floor(Math.random() * 1e9))]
    }));
    console.log(`🔁 Reposted message ${messageId} to ${toChannel.title}`);
  } catch (e: any) {
    console.error("Failed to repost message:", e.message);
  }
}
