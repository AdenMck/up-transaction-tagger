//TODO // read html from file to use as template BEFORE starting the deno server
import * as UpTypes from "./types.ts";
import { checkTransactionNeedsTagging } from "./utils.ts";

const UpApiKey = Deno.env.get("UPAPIKEY");
const upWebhookId = Deno.env.get("UPWEBHOOKID");
const mainAccount = Deno.env.get("MAINACCOUNT");

if (!UpApiKey) {
  throw new Error("UPAPIKEY environment variable not set");
}
if (!mainAccount) {
  throw new Error("MAINACCOUNT environment variable not set");
}

// End variables

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
  // processTransactionFromWebhook(body);
  return Response.json({ message: "Thanks :D" }, { status: 200 });
}

async function processTransactionFromWebhook(webhook: UpTypes.UpRootObject) {
  if (
    webhook.data.attributes.eventType === "TRANSACTION_CREATED" ||
    webhook.data.attributes.eventType === "TRANSACTION_SETTLED"
  ) {
    await checkTransactionNeedsTagging(webhook.data.relationships.transaction.data.id)
  }
  return;
}

export async function webHandler(req: Request): Promise<Response> {
  if (new URLPattern({ pathname: "/ping" }).test(req.url)) {
    return new Response("pong", { status: 200 });
  }

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
