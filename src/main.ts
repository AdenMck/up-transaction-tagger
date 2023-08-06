import { webHandler } from "./web.ts";
import { discord } from "./discord.ts";

function main() {
  Deno.serve(webHandler);
  discord();
}

main();
