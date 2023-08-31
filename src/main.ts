import "https://deno.land/std/dotenv/load.ts";
import { webHandler } from "./web.ts";
import { discord } from "./discord.ts";

function main() {
  const version = "0.1.8-Now-With-Categories";
  console.log("Starting Up Transaction Tagger.  Version " + version);

  Deno.serve(webHandler);
  discord();
}

main();
