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
  TextChannel,
} from "npm:discord.js@^14.12.1";

import * as UpTypes from "./types.ts";
import {
  addTag,
  getBalance,
  getTransactions,
  processTransaction,
  removeTag,
} from "./utils.ts";
// Log in to Discord with your client's token
const token = Deno.env.get("DISCORD_TOKEN");
const guildId = Deno.env.get("DISCORD_GUILDID");
const channelId = Deno.env.get("DISCORD_CHANNELID");
const pingUser = Deno.env.get("DISCORD_PINGUSER");

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
  const balanceCommand = {
    name: "balance",
    description: "Retrieve current account balance",
  };
  const processrecentCommand = {
    name: "processrecent",
    description: "Process recent transactions",
    options: [
      {
        name: "number",
        description: "The number of transactions to process",
        type: 4,
        required: false,
      },
    ],
  };

  const guild = client.guilds.cache.get(guildId!);
  if (!guild) {
    console.log("No guild found");
    return;
  }

  guild.commands.create(pingCommand);
  guild.commands.create(balanceCommand);
  guild.commands.create(processrecentCommand);

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
    await removeTag(transactionID, "Bills");
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
      interaction.editReply({ content: "", embeds: [embed] });
    } else {
      interaction.followUp({ content: `Tag Update Failed`, ephemeral: true });
    }
    return;
  }

  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName === "balance") {
    if (interaction.user.id !== pingUser) {
      await interaction.reply({
        content: "You are not authorised to use this command",
        ephemeral: true,
      });
      return;
    }
    const mainAccount = Deno.env.get("MAINACCOUNT");
    const balance = await getBalance(mainAccount!);
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(`Account Balance is $${balance?.data.attributes.balance.value}`)
      // .setURL("https://discord.js.org/")
      .setAuthor({
        name: "Up Transaction Tagger",
      })
      .setThumbnail(
        "https://up.com.au/static/6cc06998a880f98acb5a57f45c7114e0/up-logo-transparent.png",
      )
      .setTimestamp();
    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } else if (interaction.commandName === "processrecent") {
    const number = interaction.options.get("number")?.value?.toString();
    const transactions = await getTransactions(number);
    if (!transactions) {
      await interaction.reply({
        content: "No transactions found",
        ephemeral: true,
      });
      return;
    }
    await interaction.reply({
      content: "Queued for processing",
      ephemeral: true,
    });
    transactions.data.forEach(async (transaction) => {
      processTransaction(transaction.id);
    });
    return;
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
      name: "Up Transaction Tagger",
    })
    .setThumbnail(
      "https://up.com.au/static/6cc06998a880f98acb5a57f45c7114e0/up-logo-transparent.png",
    )
    .setDescription(transaction.data.id) //transaction ID
    .addFields(
      { name: "Description", value: transaction.data.attributes.description },
      {
        name: "Amount",
        value: `$${transaction.data.attributes.amount.value}`,
        inline: true,
      },
    )
    .setTimestamp();

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

  const bills = new ButtonBuilder()
    .setCustomId(
      JSON.stringify({
        transactionId: transaction.data.id,
        category: "Bills",
      }),
    )
    .setLabel("Bill")
    .setStyle(ButtonStyle.Secondary);

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
    bills,
    ignore,
  );
  const message = { content: "", embeds: [embed], components: [row] };
  if (pingUser) {
    message.content = `<@${pingUser}>`;
  }
  channel.send(message);
  return true;
}
