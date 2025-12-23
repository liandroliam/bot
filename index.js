// dotenv nur lokal nutzen (Railway braucht das nicht)
if (process.env.RAILWAY_ENVIRONMENT_NAME == null) {
  require("dotenv").config();
}

const cron = require("node-cron");
const { Client, GatewayIntentBits, Events } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Debug (zeigt nur ob gesetzt, NICHT den Token)
console.log("ENV CHECK:", {
  hasToken: Boolean(TOKEN),
  hasChannelId: Boolean(CHANNEL_ID),
  railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME || null,
});

if (!TOKEN || !CHANNEL_ID) {
  console.error("Fehler: DISCORD_TOKEN oder CHANNEL_ID fehlt (Railway Variables prüfen).");
  process.exit(1);
}


const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function postPoll(channel, text) {
  await channel.send({
    poll: {
      question: { text },
      answers: [
        { text: "Bin dabei", emoji: "✅" },
        { text: "Nein", emoji: "❌" },
      ],
      duration: 16, // Stunden
      allow_multiselect: false,
    },
  });
}

async function postDailyPolls() {
  try {
    const channel = await client.channels.fetch(CHANNEL_ID);

    if (!channel || !channel.isTextBased()) {
      console.error("Channel nicht gefunden oder kein Text-Channel.");
      return;
    }
	
	// @everyone ping
	await channel.send({
		content: "@everyone",
		allowedMentions: { parse: ["everyone"] },
	});

    // Header
    await channel.send({
      content:
        `📌 **Heutige Fun CW-Abstimmungen** 📌\n` +
        `**Bitte stimmt in beiden Umfragen ab:**\n`,
    });

    // Polls direkt darunter
    await postPoll(channel, "Fun CW 20:30 Uhr");
    await postPoll(channel, "Fun CW 22:30 Uhr");

    console.log("Header + beide Polls gepostet.");
  } catch (err) {
    console.error("Fehler beim Posten:", err);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Eingeloggt als ${client.user.tag}`);

  //Zum Testen einmal aktivieren:
  //await postDailyPolls();

  //Jeden Tag um 08:00 Europe/Berlin
  cron.schedule(
    "0 8 * * *",
    () => postDailyPolls(),
    { timezone: "Europe/Berlin" }
  );
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

client.login(TOKEN);
