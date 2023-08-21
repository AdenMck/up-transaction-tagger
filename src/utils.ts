import * as UpTypes from "./types.ts";
import { sendEmbedWithButtons } from "./discord.ts";
const UpApiKey = Deno.env.get("UPAPIKEY");
const todoTag = "Unsorted";
const mainAccount = Deno.env.get("MAINACCOUNT");

if (!UpApiKey || !mainAccount) {
  throw new Error("environment variable not set");
}

export async function addTag(id: string, tag: string): Promise<boolean> {
  const url =
    `https://api.up.com.au/api/v1/transactions/${id}/relationships/tags`;
  const body = { data: [{ type: "tags", id: tag }] };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${UpApiKey}`,
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(url, options);
  if (response.status !== 204) {
    console.log(`Error adding tag '${tag}' to transaction '${id}'`);
    return false;
  } else {
    console.log(`Added tag '${tag}' to transaction '${id}'`);
    return true;
  }
}

export async function removeTag(id: string, tag: string): Promise<boolean> {
  const url =
    `https://api.up.com.au/api/v1/transactions/${id}/relationships/tags`;
  const body = { data: [{ type: "tags", id: tag }] };
  const options = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${UpApiKey}`,
    },
    body: JSON.stringify(body),
  };
  const response = await fetch(url, options);
  if (response.status !== 204) {
    console.log(`Error removing tag '${tag}' from transaction '${id}'`);
    return false;
  } else {
    console.log(`Removed tag '${tag}' from transaction '${id}'`);
    return true;
  }
}

export async function getTransaction(
  id: string,
): Promise<UpTypes.UpRootObject | null> {
  const url = `https://api.up.com.au/api/v1/transactions/${id}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UpApiKey}`,
    },
  });
  const statusCode = response.status;
  if (statusCode !== 200) {
    console.log("Error getting URL: " + url);
    console.log("Status code: " + statusCode);
    console.log("Response: " + await response.text());
    return null;
  }
  return response.json();
}
export async function getTransactions(
  pageSize = "10",
): Promise<UpTypes.UpTransactionList|null> {
  const url =
    `https://api.up.com.au/api/v1/transactions/?page[size]=${pageSize}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UpApiKey}`,
    },
  });
  const statusCode = response.status;
  if (statusCode !== 200) {
    console.log("Error getting URL: " + url);
    console.log("Status code: " + statusCode);
    console.log("Response: " + await response.text());
    return null;
  }
  return response.json();
}

export async function getBalance(
  id: string,
): Promise<UpTypes.UpRootObject | null> {
  const url = `https://api.up.com.au/api/v1/accounts/${id}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${UpApiKey}`,
    },
  });
  const statusCode = response.status;
  if (statusCode !== 200) {
    console.log("Error getting URL: " + url);
    console.log("Status code: " + statusCode);
    console.log("Response: " + await response.text());
    return null;
  }
  return response.json();
}

export async function processTransaction(id: string): Promise<void> {
  const transaction = await getTransaction(id);
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

  sendEmbedWithButtons(transaction);
  return;
}
