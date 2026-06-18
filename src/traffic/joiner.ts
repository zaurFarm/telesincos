export async function joinGroup(client: any, username: string) {
  try {
    await client.invoke({
      _: "channels.joinChannel",
      channel: username
    });

    console.log("Вступили в", username);
  } catch (e) {
    console.log("Ошибка входа", username);
  }
}