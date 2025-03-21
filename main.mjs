import fs from "fs";
import path from "path";
import express from "express";
import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
  EmbedBuilder,
} from "discord.js";

import CommandsRegister from "./regist-commands.mjs";

import Sequelize from "sequelize";
import Parser from "rss-parser";
const parser = new Parser();

let postCount = 0;
const app = express();
app.listen(3000);
app.post("/", function (req, res) {
  console.log(`Received POST request.`);

  postCount++;
  if (postCount == 3) {
    checkNewVideos();
    postCount = 0;
  }

  res.send("POST response by glitch");
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(process.cwd(), "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".mjs"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  import(filePath).then((module) => {
    client.commands.set(module.data.name, module);
  });
}

const handlers = new Map();

const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs
  .readdirSync(handlersPath)
  .filter((file) => file.endsWith(".mjs"));

for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  import(filePath).then((module) => {
    handlers.set(file.slice(0, -4), module);
  });
}

client.on("interactionCreate", async (interaction) => {
  await handlers.get("interactionCreate").default(interaction);
});

client.on("messageCreate", async (message) => {
  if (message.author.id == client.user.id || message.author.bot) return;
  await handlers.get("messageCreate").default(message);
});

client.on("ready", async () => {
  await client.user.setActivity("アーカイブを見返し中", {
    type: ActivityType.watching,
  });
  console.log(`${client.user.tag} がログインしました！`);
  checkNewVideos();
});

CommandsRegister();
client.login(process.env.TOKEN);

// 📌 Discordサーバーごとの通知先チャンネルを設定（固定）
const serverChannels = {
  "1334556787449397258": "1347202847724408832", // 本サーバー
  "1342664839343902720": "1342664839343902723", //テストサーバー
};

// **YouTubeチャンネルごとの設定**（YouTube RSSフィード: 通知メッセージ）
const youtubeChannels = [
  {
    name: "儒烏風亭らでん",
    feedUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCdXAk5MpyLD8594lm_OvtGQ",
    message: "**儒烏風亭らでんの新着動画です！**",
    coller: "1c5e4f",
    latestVideoDate: null,
    latestVideoId:null,
  },
  {
    name: "火威青",
    feedUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCMGfV7TVTmHhEErVJg1oHBQ",
    message: "**火威青の新着動画です！**",
    coller: "1d3467",
    latestVideoDate: null,
    latestVideoId:null,
  },
  {
    name: "音乃瀬奏",
    feedUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCWQtYtq9EOB4-I5P-3fh8lA",
    message: "**音乃瀬奏の新着動画です！**",
    coller: "f6c663",
    latestVideoDate: null,
    latestVideoId:null,
  },
  {
    name: "一条莉々華",
    feedUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UCtyWhCj3AqKh2dXctLkDtng",
    message: "**一条莉々華の新着動画です！**",
    coller: "ee558b",
    latestVideoDate: null,
    latestVideoId:null,
  },
  {
    name: "轟はじめ",
    feedUrl:
      "https://www.youtube.com/feeds/videos.xml?channel_id=UC1iA6_NT4mtAcIII6ygrvCw",
    message: "**轟はじめの新着動画です！**",
    coller: "9293fe",
    latestVideoDate: null,
    latestVideoId:null,
  },
];

// **新着動画をチェックする関数**
async function checkNewVideos() {
  for (const channel of youtubeChannels) {
    try {
      let feed = await parser.parseURL(channel.feedUrl);
      if (!feed.items || feed.items.length === 0) continue;

      // 最新の動画情報を取得
      const latestVideo = feed.items[0];
      const latestVideoDate = new Date(latestVideo.isoDate); // 投稿日時
      const latestvideoId = latestVideo.id.replace("yt:video:", "");

      // 前回の最新動画の日時と比較
      if (channel.latestVideoDate && (latestVideoDate == new Date(channel.latestVideoDate) || channel.latestVideoId === latestvideoId)) {
        console.log(`最新動画じゃないね: ${channel.name}`);
        continue;
      } else if (!channel.latestVideoDate) {
        // 初回実行（または再起動後）の場合は通知せずに記録のみ
        channel.latestVideoDate = latestVideoDate;
        channel.latestVideoId = latestvideoId;
        console.log(`再起動後の初回チェック: ${channel.name}`);
        continue;
      }

      // **先に最新の動画日時を更新する**
      channel.latestVideoDate = latestVideoDate;
      channel.latestVideoId = latestvideoId;

      // **各サーバーに通知を送信**
      for (const [guildId, channelId] of Object.entries(serverChannels)) {
        const discordChannel = client.channels.cache.get(channelId);
        if (!discordChannel) continue;

        const embed = new EmbedBuilder()
          .setColor(channel.coller)
          .setTitle(latestVideo.title)
          .setURL(latestVideo.link)
          .setDescription(channel.message)
          .setTimestamp(latestVideoDate);

        await discordChannel.send({ embeds: [embed] });
      }

      console.log(`新着動画を通知しました: ${channel.name}`);
    } catch (error) {
      console.error(`❌ ${channel.name} のRSS取得中にエラー発生:`, error);
    }
  }
}

