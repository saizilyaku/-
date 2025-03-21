import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("遅延確認");

export async function execute(interaction) {
  try {
    // 応答開始
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });

    // 各種遅延の計算
    const roundtripLatency =
      sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = interaction.client.ws.ping;

    // ダミーデータ: 外部マイクロサービスの遅延
    const microLatency = await getMicroLatency(); // 動的データ取得に変更

    // Embed メッセージの作成
    const pingembed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(":ping_pong: Pong!")
      .addFields(
        {
          name: ":hourglass:**RoundTripLatency**:",
          value: `__${roundtripLatency}ms__`,
          inline: true,
        },
        {
          name: ":satellite:**MicroLatency**:",
          value: `__${microLatency}ms__`,
          inline: true,
        },
        {
          name: ":stopwatch:**WSLatency**:",
          value: `__${wsLatency}ms__`,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({ text: "Pingコマンド" });

    // Embed の応答を更新
    await interaction.editReply({ content: null, embeds: [pingembed] });
  } catch (error) {
    console.error("Pingコマンド実行中のエラー:", error);

    // ユーザーにエラーメッセージを送信
    if (!interaction.replied) {
      await interaction.reply({
        content: "エラーが発生しました。もう一度お試しください。",
        ephemeral: true,
      });
    } else {
      await interaction.followUp({
        content: "エラーが発生しました。",
        ephemeral: true,
      });
    }
  }
}

// マイクロサービス遅延を取得する仮の非同期関数
async function getMicroLatency() {
  // 本番環境では API 呼び出しや別のロジックを実装
  return new Promise((resolve) => setTimeout(() => resolve(15), 50)); // 15ms の仮値を返す
}
