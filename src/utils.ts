import * as UpTypes from "./up.ts";

const UpApiKey = Deno.env.get("UPAPIKEY");

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
