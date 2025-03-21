import { ndnDice } from "../commands/dice.mjs";

export default async (message) => {
  if (message.content.match(/^\d+d\d+$/)) {
    await message.reply(ndnDice(message.content));
  }
  if (message.mentions.everyone) {
    try {
      await message.delete();
      console.log(
        `🛑 Deleted message from ${message.author.tag}: ${message.content}`
      );
      // 送信者にDMで通知
      await message.author.send(
        "❌ あなたのメッセージは @everyone または @here を含んでいたため削除されました。"
      );
    } catch (error) {
      console.error("メッセージ削除エラー:", error);
    }
  }
};
