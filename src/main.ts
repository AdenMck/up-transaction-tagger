import { webHandler } from "./web.ts";
import { discord } from "./discord.ts";

function main() {
  const version = "0.1.2-experimental";
  console.log("Starting Up Transaction Tagger.  Version " + version);

  Deno.serve(webHandler);
  discord();
}

main();
