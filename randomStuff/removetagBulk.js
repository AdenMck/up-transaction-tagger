import "https://deno.land/std@0.197.0/dotenv/load.ts";
const UpApiKey = Deno.env.get("UPAPIKEY");
const upBaseUrl = "https://api.up.com.au/api/v1";
const mainAccount = Deno.env.get("MAINACCOUNT");

async function makeAuthenticatedRequest(url, options) {
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
    console.log("Error while handling URL: " + url);
    console.log("Status code: " + statusCode);
    console.log("Response: " + await response.text());
    return null;
  }
  const result = await response.text();
  try {
    return JSON.parse(result);
  } catch (_e) {
    return result;
  }
}

export async function removeTag(id, tag) {
  const url = `${upBaseUrl}/transactions/${id}/relationships/tags`;
  const body = { data: [{ type: "tags", id: tag }] };
  const options = {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
  const result = await makeAuthenticatedRequest(url, options);
  return result !== null;
}

export async function getTransaction(id) {
  const url = `${upBaseUrl}/transactions/${id}`;
  return await makeAuthenticatedRequest(url, {});
}

export async function getTransactionList(pageSize = "100") {
  let url =
    `${upBaseUrl}/accounts/${mainAccount}/transactions/?page[size]=${pageSize}`;

  return await makeAuthenticatedRequest(url, {});
}

const transactions = await getTransactionList(100);
console.log(transactions)
console.log(`Next page: ${transactions.links.next}`);
for (const transaction of transactions.data) {
  const id = transaction.id;
  const tags = transaction.relationships.tags.data;
  console.log("-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\nRemoving tags from transaction: " + id)
  for (const tag of tags) {
    console.log("Removing tag: " + tag.id);
    console.log(await removeTag(id, tag.id));
  };
};
