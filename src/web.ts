//TODO // read html from file to use as template BEFORE starting the deno server
import * as UpTypes from "./up.ts";
import { addTag, getTransaction } from "./utils.ts";
import { sendEmbedWithButtons } from "./discord.ts";

const version = "0.0.6-experimental";

const todoTag = "Unsorted";

const UpApiKey = Deno.env.get("UPAPIKEY");
const upWebhookId = Deno.env.get("UPWEBHOOKID");
const mainAccount = Deno.env.get("MAINACCOUNT");

console.log("Starting web server.  Version " + version);

if (!UpApiKey) {
  throw new Error("UPAPIKEY environment variable not set");
}
if (!mainAccount) {
  throw new Error("MAINACCOUNT environment variable not set");
}

// End variables

// Respond with JSON
// return Response.json({ text: "Hello world from Deno!" }, { status: 418 });

// Webhook handler
async function webhook(req: Request, id: string): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(null, { status: 405 });
  }

  if (id === upWebhookId) {
    if (req.headers.get("x-up-authenticity-signature")) {
      const body = await req.json();
      return upWebhook(body);
    } else {
      return new Response("Missing signature", { status: 401 });
    }
  }

  return new Response("Unknown webhook ID", { status: 404 });
}

// Handle webhook requests from Up
function upWebhook(body: UpTypes.UpRootObject): Response {
  console.log("-=-=-=-=-=-=-=-=-=-\nWebhook received");
  console.log("Created: ", body.data.attributes.createdAt);
  console.log("Event type: ", body.data.attributes.eventType);
  console.log("Transaction ID: ", body.data.relationships.transaction.data.id);
  processTransactionFromWebhook(body);
  return Response.json({ message: "Thanks :D" }, { status: 200 });
}

async function processTransactionFromWebhook(webhook: UpTypes.UpRootObject) {
  if (
    webhook.data.attributes.eventType === "TRANSACTION_CREATED" ||
    webhook.data.attributes.eventType === "TRANSACTION_SETTLED"
  ) {
    const transaction = await getTransaction(
      webhook.data.relationships.transaction.data.id,
    );
    if (transaction === null) {
      console.log(
        "-=-=-=-=-=-=-=-=-=-\nTransaction not found, not processing further",
      );
      return;
    }
    console.log(
      "-=-=-=-=-=-=-=-=-=-\nTransaction information from transaction request",
    );
    console.log(transaction);
    console.log("transaction ID: " + transaction.data.id);
    console.log("tags: ");
    console.log(transaction.data.relationships.tags.data);
    console.log();

    // Check whether to process transaction
    if (transaction.data.relationships.account.data.id !== mainAccount) {
      console.log("Skipping: Transaction not involving main account");
      return;
    }
    if (transaction.data.relationships.tags.data.length !== 0) {
      console.log("Skipping: Transaction already has tags");
      return;
    }
    const isSaverTransfer = transaction.data.relationships.transferAccount.data;
    if (isSaverTransfer) {
      console.log("Skipping: Transaction is a saver transfer");
      return;
    }
    const hasMessage = !(transaction.data.attributes.message === null);
    // if (hasMessage) {
    //   console.log("Skipping: Transaction has a message");
    //   return;
    // }

    console.log("Transaction needs to be processed");
    await addTag(transaction.data.id, todoTag);
    // await addTag(transaction.data.id, processedTag);
    sendEmbedWithButtons(transaction);
    // sendMessage("Amount: "+ transaction.data.attributes.amount.value);
    // sendMessage("Description: "+ transaction.data.attributes.description);


    // console.log(transaction)
  }
  return;
}




export async function webHandler(req: Request): Promise<Response> {
  if (new URLPattern({ pathname: "/ping" }).test(req.url)) {
    return new Response("pong", { status: 200 });
  }

  // https://deno.land/api@v1.35.3?s=URLPattern

  // Webhook
  const matchWebhook = new URLPattern({ pathname: "/hook/:id" }).exec(req.url);
  if (matchWebhook) {
    const webhookIdfromUrl = matchWebhook.pathname.groups.id ?? "";
    const response = webhook(req, webhookIdfromUrl);
    return response;
    // return new Response(null, { status: 500 });
  }

  return new Response(null, { status: 404 });
}