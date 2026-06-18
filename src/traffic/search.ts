import { TelegramClient } from "telegram";

export async function searchGroups(client: TelegramClient, keyword: string) {
  try {
      const result = await client.invoke({
        _: "contacts.search",
        q: keyword,
        limit: 20
      } as any);

      return (result as any).chats?.filter((c: any) => c.megagroup) || [];
  } catch (e) {
      console.error("Search groups error", e);
      return [];
  }
}

export const keywords = [
  "вейп",
  "жидкость",
  "pod",
  "электронные сигареты",
  "никотин",
  "сиги"
];