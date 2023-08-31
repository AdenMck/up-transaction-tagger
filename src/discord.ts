// deno-lint-ignore-file require-await
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  Interaction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "npm:discord.js@^14.12.1";
import * as UpTypes from "./types.ts";
import {
  checkTransactionNeedsTagging,
  getAccountDetails,
  getTransaction,
  getTransactionList,
  setCategory,
} from "./utils.ts";
import categoryEmoji from "./categoryEmoji.ts";
import categories from "./categories.ts";
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

async function onceReady(client: Client) {
  console.log(`Ready! Logged in as ${client.user!.tag}`);
  isConnected = true;
  registerGuildCommands();
  client.on("interactionCreate", interactionHandler);
}

async function registerGuildCommands() {
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
}
async function interactionHandler(interaction: Interaction) {
  // console.log(interaction);
  if (interaction.isStringSelectMenu()) {
    await handleStringSelectMenu(interaction);
  }

  if (interaction.isButton()) {
    await buttonHandler(interaction);
  }

  if (interaction.isChatInputCommand()) {
    await commandHandler(interaction);
  }
}
async function commandHandler(interaction: ChatInputCommandInteraction) {
  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  } else if (interaction.commandName === "balance") {
    handleBalanceCommand(interaction);
  } else if (interaction.commandName === "processrecent") {
    handleProcessRecentCommand(interaction);
  }
}

export async function discord() {
  // Create a new client instance
  console.log("discord initialising");
}

async function handleBalanceCommand(interaction: ChatInputCommandInteraction) {
  if (interaction.user.id !== pingUser) {
    await interaction.reply({
      content: "You are not authorised to use this command",
      ephemeral: true,
    });
    return;
  }
  const mainAccount = Deno.env.get("MAINACCOUNT");
  const balance = await getAccountDetails(mainAccount!);
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
}
async function handleProcessRecentCommand(
  interaction: ChatInputCommandInteraction,
) {
  await interaction.deferReply({ ephemeral: true });
  const number = interaction.options.get("number")?.value?.toString();
  const transactions = await getTransactionList(number);
  if (!transactions) {
    await interaction.editReply({ content: "No transactions found" });
    return;
  }
  await interaction.editReply({ content: "Queued for processing" });
  transactions.data.forEach(async (transaction) => {
    checkTransactionNeedsTagging(transaction.id);
  });
  return;
}

export async function sendNewTransactionembed(
  transaction: UpTypes.UpRootObject,
) {
  if (!isConnected) {
    console.log("Not connected");
    return false;
  }

  const channel = client.channels.cache.get(channelId!);
  if (!channel) {
    console.log("No channel found");
    return false;
  }
  if (!(channel instanceof TextChannel)) {
    console.log("Channel is not a text channel");
    return false;
  }

  const embed = makeEmbed(transaction);
  const row = makeCategoryButtonRow(
    transaction.data.id,
    true,
    ButtonStyle.Primary,
    true,
    ButtonStyle.Secondary,
  );
  const message = { content: "", embeds: [embed], components: [row] };
  if (pingUser) {
    message.content = `<@${pingUser}>`;
  }
  let returnValue = false;

  try {
    await channel.send(message);
    return true;
  } catch (err) {
    console.error(`Unable to send message: ${err}`);
    return false;
  }
}
async function buttonHandler(interaction: ButtonInteraction) {
  // console.log(interaction);
  await interaction.deferUpdate();
  console.log(
    "Processing button interaction.  Custom ID:" + interaction.customId,
  );
  let detailsFromInteraction;
  try {
    detailsFromInteraction = await JSON.parse(interaction.customId);
  } catch (error) {
    // Handle the error gracefully
    console.error("Error parsing JSON:", error.message);
    interaction.followUp({
      content: `Tag Update Failed.  Error parsing JSON:${error.message}`,
      ephemeral: true,
    });
    detailsFromInteraction = {};
    return;
  }
  console.log(detailsFromInteraction);
  const transactionId = detailsFromInteraction.t;
  const action = detailsFromInteraction.a;
  if (!transactionId) {
    console.log("Invalid interactionId: t not set");
    return;
  }
  if (action) {
    await handleButtonAction(interaction, transactionId, action);
  }
}

async function interactionRemoveCategory(
  interaction: ButtonInteraction,
  transactionId: string,
) {
  const success = await setCategory(transactionId, null);
  if (!success) {
    interaction.followUp({
      content: `Category Update Failed, see logs for further information`,
      ephemeral: true,
    });
    return;
  }
  await interactionConfirmCategory(interaction, transactionId);
  return;
}

async function handleButtonAction(
  interaction: ButtonInteraction,
  transactionId: string,
  action: string,
) {
  if (action === "change") {
    await createCategoryActionRows(interaction, transactionId);
  } else if (action === "confirm") {
    await interactionConfirmCategory(interaction, transactionId);
  } else if (action === "remove") {
    await interactionRemoveCategory(interaction, transactionId);
  }
}

async function interactionConfirmCategory(
  interaction: ButtonInteraction,
  transactionId: string,
) {
  const transaction = await getTransaction(transactionId);
  if (!transaction) {
    console.log(`No transaction found for ${transactionId}`);
    interaction.editReply({
      content: `Transaction ${transactionId} not found`,
      embeds: [],
    });
    return;
  }

  const embed = await makeEmbed(transaction);
  embed.data.title = `Categorisation confirmed`;
  interaction.editReply({
    content: "",
    embeds: [embed],
    components: [makeCategoryButtonRow(
      transaction.data.id,
      true,
      ButtonStyle.Secondary,
      false,
      undefined,
    )],
  });
}

async function createCategoryActionRows(
  interaction: Interaction,
  transactionId: string,
) {
  const { names, tree } = categories;

  // create a const called rows to store the list of ActionRowBuilders
  let rows = [];
  for (const parent of tree) {
    const parentName = names.get(parent.id);
    if (!parentName) {
      console.log(`No name found for ${parent.id}`);
      continue;
    }
    const options = [];
    for (const child of parent.children!) {
      const value = { t: transactionId, c: child.id };
      const newOption = new StringSelectMenuOptionBuilder()
        .setLabel(names.get(child.id) || child.id)
        .setValue(JSON.stringify(value));
      const emoji = categoryEmoji.get(child.id);
      if (emoji) {
        newOption.setEmoji(emoji);
      }
      options.push(newOption);
    }
    const menu = new StringSelectMenuBuilder()
      .setCustomId(parent.id)
      .setPlaceholder(`${categoryEmoji.get(parent.id)} ${(names.get(parent.id) || "")}`)
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(menu);
    rows.push(row);
  }
  rows.push(
    makeCategoryButtonRow(
      transactionId,
      false,
      undefined,
      true,
      ButtonStyle.Danger,
      "Cancel change",
    ),
  );
  // console.log(rows);
  interaction.editReply({ components: rows });
}

function makeCategoryButtonRow(
  transactionId: string,
  changeButton = false,
  changeButtonStyle = ButtonStyle.Secondary,
  confirmButton = false,
  confirmButtonStyle = ButtonStyle.Secondary,
  confirmButtonLabel = "Confirm Category",
) {
  const buttons = [];
  if (changeButton) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(
          JSON.stringify({
            t: transactionId,
            a: "change",
          }),
        )
        .setLabel("Change Category")
        .setStyle(changeButtonStyle),
    );
  }
  if (confirmButton) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(
          JSON.stringify({
            t: transactionId,
            a: "confirm",
          }),
        )
        .setLabel(confirmButtonLabel)
        .setStyle(confirmButtonStyle),
    );
  }
  if (confirmButtonStyle === ButtonStyle.Danger) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(
          JSON.stringify({
            t: transactionId,
            a: "remove",
          }),
        )
        .setLabel("Remove Category")
        .setStyle(ButtonStyle.Secondary),
    );
  }
  const row = new ActionRowBuilder().addComponents(buttons);
  return row;
}

async function handleStringSelectMenu(
  interaction: StringSelectMenuInteraction,
) {
  await interaction.deferUpdate();
  const rawDetails = interaction.values[0];
  console.log("Raw value from StringSelect Interaction:" + rawDetails);
  let detailsFromInteraction;
  try {
    detailsFromInteraction = await JSON.parse(rawDetails);
  } catch (error) {
    // Handle the error gracefully
    console.error("Error parsing JSON:", error.message);
    interaction.followUp({
      content: `Category Update Failed.  Error parsing JSON: ${error.message}`,
      ephemeral: true,
    });
    detailsFromInteraction = {};
    return;
  }
  console.log(detailsFromInteraction);
  const transactionId = detailsFromInteraction.t;
  const category = detailsFromInteraction.c;
  if (!transactionId || !category) {
    console.log(
      "Invalid interaction details, either transactionId or category was not set",
    );
    interaction.followUp({
      content:
        `Category Update Failed, either transactionId or category was not set`,
      ephemeral: true,
    });
  }
  const success = await setCategory(transactionId, category);
  if (!success) {
    interaction.followUp({
      content: `Category Update Failed, see logs for further information`,
      ephemeral: true,
    });
    return;
  }

  await interactionConfirmCategory(interaction, transactionId);
  return;
}

const makeEmbed = (transaction: UpTypes.UpRootObject) => {
  const { names } = categories;
  const parentCategoryId = transaction.data.relationships.parentCategory.data
    ?.id;
  const childCategoryId = transaction.data.relationships.category.data?.id;
  const parentCategory = names.get(parentCategoryId) || "Uncategorised";
  const childCategory = names.get(childCategoryId) || "Uncategorised";

  const categoryString = `${
    categoryEmoji.get(parentCategoryId) || ""
  } ${parentCategory} > ${
    categoryEmoji.get(childCategoryId) || ""
  } **${childCategory}**`;
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle("New transaction available for categorisation!")
    // .setURL("https://discord.js.org/")
    .setAuthor({
      name: "Up Transaction Tagger",
    })
    .setThumbnail(
      "https://up.com.au/static/6cc06998a880f98acb5a57f45c7114e0/up-logo-transparent.png",
    )
    .setDescription(transaction.data.id) //transaction ID
    .addFields(
      {
        name: "Category",
        value: categoryString,
      },
      {
        name: "Description",
        value: transaction.data.attributes.description,
        inline: true,
      },
      {
        name: "Amount",
        value: `$${transaction.data.attributes.amount.value}`,
        inline: true,
      },
    )
    .setTimestamp(
      new Date(
        transaction.data.attributes.createdAt ??
          transaction.data.attributes.settledAt,
      ),
    );
  return embed;
};
