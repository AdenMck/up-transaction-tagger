// deno-lint-ignore-file require-await
// Require the necessary discord.js classes
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Interaction,
} from "npm:discord.js@^14.12.1";

import * as UpTypes from "./types.ts";
import { addTag, removeTag } from "./utils.ts";

// Log in to Discord with your client's token
const token = Deno.env.get("DISCORD_TOKEN");
const guildId = Deno.env.get("DISCORD_GUILDID");
const channelId = Deno.env.get("DISCORD_CHANNELID");
if (!token || !guildId || !channelId) {
  console.log("ERROR: Missing environment variables");
}
let isConnected = false;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.login(token);
client.once(Events.ClientReady, onceReady);

export async function discord() {
  // Create a new client instance
  console.log("discord");
}

async function onceReady(client: Client) {
  console.log(`Ready! Logged in as ${client.user!.tag}`);
  isConnected = true;
  const pingCommand = {
    name: "ping",
    description: "Test the bot's responsiveness with a simple ping command",
  };

  const guild = client.guilds.cache.get(guildId!);
  if (!guild) {
    console.log("No guild found");
    return;
  }

  guild.commands.create(pingCommand);

  const channel = client.channels.cache.get(channelId!);
  if (!channel) {
    console.log("No channel found");
    return;
  }
  // channel.send("Hello!");

  client.on("interactionCreate", interactionHandler);
}

async function interactionHandler(interaction: Interaction) {
  // console.log(interaction);
  if (interaction.isStringSelectMenu()) {
    interaction.deferUpdate();
    return;
  }

  if (interaction.isButton()) {
    await interaction.deferUpdate();
    console.log(interaction.customId);
    let interactionDetails;
    try {
      interactionDetails = await JSON.parse(interaction.customId);
      // Your code logic using interactionDetails goes here
    } catch (error) {
      // Handle the error gracefully
      console.error("Error parsing JSON:", error.message);
      interaction.followUp({
        content: `Tag Update Failed.  Error parsing JSON: ${error.message}`,
        ephemeral: true,
      });
      interactionDetails = {};
      return;
    }
    // console.log(interactionDetails)
    if (!interactionDetails.transactionId || !interactionDetails.category) {
      console.log("Invalid interaction details");
      interaction.followUp({
        content:
          `Tag Update Failed, either transactionId or category was not set`,
        ephemeral: true,
      });
      return;
    }
    console.log(interactionDetails);
    const transactionID = interactionDetails.transactionId;
    const category = interactionDetails.category;
    await removeTag(transactionID, "Unsorted");
    await removeTag(transactionID, "Necessary");
    await removeTag(transactionID, "Unnecessary");
    await removeTag(transactionID, "Ignored");
    const didAddTag = await addTag(transactionID, category);
    console.log(didAddTag);
    if (didAddTag) {
      interaction.followUp({
        content: `Tag Updated to ${category}`,
        ephemeral: true,
      });
      const embed = interaction.message.embeds[0];
      embed.data.title = `Transaction previously tagged as ${category}`;
      interaction.editReply({ embeds: [embed] });
    } else {
      interaction.followUp({ content: `Tag Update Failed`, ephemeral: true });
    }
    return;
  }

  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
}

export function sendEmbedWithButtons(
  transaction: UpTypes.UpRootObject,
): boolean {
  if (!isConnected) {
    console.log("Not connected");
    return false;
  }

  const channel = client.channels.cache.get(channelId!);
  if (!channel) {
    console.log("No channel found");
    return false;
  }

  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("New transaction to categorise!")
    // .setURL("https://discord.js.org/")
    .setAuthor({
      name: "Up Bank",
      // iconURL: "https://up.com.au/static/6cc06998a880f98acb5a57f45c7114e0/up-logo-transparent.png",
      // url: "https://discord.js.org",
    })
    .setThumbnail(
      "https://up.com.au/static/6cc06998a880f98acb5a57f45c7114e0/up-logo-transparent.png",
    )
    .setDescription(transaction.data.id) //transaction ID
    .addFields(
      { name: "Description", value: transaction.data.attributes.description },
      // { name: "\u200B", value: "\u200B" },
      {
        name: "Amount",
        value: `$${transaction.data.attributes.amount.value}`,
        inline: true,
      },
      // { name: "Inline field title", value: "Some value here", inline: true },
    )
    // .addFields({
    //   name: "Inline field title",
    //   value: "Some value here",
    //   inline: true,
    // })
    // .setImage("https://i.imgur.com/AfFp7pu.png")
    .setTimestamp();
  // .setFooter({
  //   text: "Some footer text here",
  //   iconURL: "https://i.imgur.com/AfFp7pu.png",
  // });
  const necessary = new ButtonBuilder()
    .setCustomId(
      JSON.stringify({
        transactionId: transaction.data.id,
        category: "Necessary",
      }),
    )
    .setLabel("Necessary")
    .setStyle(ButtonStyle.Primary);

  const unnecessary = new ButtonBuilder()
    .setCustomId(
      JSON.stringify({
        transactionId: transaction.data.id,
        category: "Unnecessary",
      }),
    )
    .setLabel("Unnecessary")
    .setStyle(ButtonStyle.Primary);

  const ignore = new ButtonBuilder()
    .setCustomId(
      JSON.stringify({
        transactionId: transaction.data.id,
        category: "Ignored",
      }),
    )
    .setLabel("Ignore")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(
    necessary,
    unnecessary,
    ignore,
  );

  channel.send({ embeds: [embed], components: [row] });
  return true;
}
