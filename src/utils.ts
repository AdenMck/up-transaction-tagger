import * as UpTypes from "./types.ts";
import { sendNewTransactionembed } from "./discord.ts";
const UpApiKey = Deno.env.get("UPAPIKEY");
const processedTag = "Discord Message Sent";
const mainAccount = Deno.env.get("MAINACCOUNT");
const upBaseUrl = "https://api.up.com.au/api/v1";

if (!UpApiKey || !mainAccount) {
  throw new Error("environment variable not set");
}

async function makeAuthenticatedRequest(url: string, options: RequestInit) {
  // add api key to header
  console.log(`Making request to: ${url} \n with options:`);
  console.log(options);
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${UpApiKey}`,
    },
  });
  const statusCode = response.status;
  // get the first number of the status code
  const firstDigit = Math.floor(statusCode / 100);
  if (firstDigit !== 2) {
    console.log("Error handling URL: " + url);
    console.log("Status code: " + statusCode);
    console.log("Response: " + await response.text());
    return null;
  }
  const result = await response.text();
  try {
    return JSON.parse(result);
  } catch (e) {
    return result;
  }
}

export async function addTag(id: string, tag: string): Promise<boolean> {
  const url = `${upBaseUrl}/transactions/${id}/relationships/tags`;
  const body = { data: [{ type: "tags", id: tag }] };
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const result = await makeAuthenticatedRequest(url, options);
  return result !== null;
}

export async function getTransaction(
  id: string,
): Promise<UpTypes.UpRootObject | null> {
  const url = `${upBaseUrl}/transactions/${id}`;
  return await makeAuthenticatedRequest(url, {});
}

export async function getTransactionList(
  pageSize = "10",
): Promise<UpTypes.UpRootObjectArray | null> {
  const url =
    `${upBaseUrl}/accounts/${mainAccount}/transactions/?page[size]=${pageSize}`;
  return await makeAuthenticatedRequest(url, {});
}

export async function getAccountDetails(
  id: string,
): Promise<UpTypes.UpRootObject | null> {
  const url = `${upBaseUrl}/accounts/${id}`;
  return await makeAuthenticatedRequest(url, {});
}

export async function setCategory(
  id: string,
  category: string | null,
): Promise<boolean> {
  const url = `${upBaseUrl}/transactions/${id}/relationships/category`;
  const body = { data: category ? { type: "categories", id: category } : null };
  const options = {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  return await makeAuthenticatedRequest(url, options) !== null;
}

export async function checkTransactionNeedsTagging(id: string): Promise<void> {
  const transaction = await getTransaction(id);
  if (transaction === null) {
    console.log(`Transaction ${id} not found, not processing further`);
    return;
  }
  console.log("Transaction information from transaction request");
  // console.log(transaction);
  console.log("transaction ID: " + transaction.data.id);
  // console.log("tags: ");
  // console.log(transaction.data.relationships.tags.data);

  // Check whether to process transaction
  // if (transaction.data.relationships.account.data.id !== mainAccount) {
  //   console.log("Skipping: Transaction not involving main account");
  //   return;
  // }
  if (transaction.data.relationships.tags.data.length !== 0) {
    console.log("Skipping: Transaction already has tags");
    return;
  }
  const isCategorizable = transaction.data.attributes.isCategorizable;
  if (!isCategorizable) {
    console.log("Skipping: Transaction is not categorizable");
    return;
  }
  console.log("Transaction needs to be processed");
  const messageSent = await sendNewTransactionembed(transaction);
  console.log("Was Message sent to Discord: " + messageSent);
  if (messageSent) {
    await addTag(transaction.data.id, processedTag);
  }
  return;
}
