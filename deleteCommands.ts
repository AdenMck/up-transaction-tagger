import "https://deno.land/std/dotenv/load.ts";
import { REST } from "npm:discord.js@^14.12.1";
import { Routes} from "npm:discord-api-types/v9"

const token = Deno.env.get("DISCORD_TOKEN");
const guildId = Deno.env.get("DISCORD_GUILDID");
const clientId = Deno.env.get("DISCORD_CLIENTID");


const rest = new REST({ version: '9' }).setToken(token);

// ...

// for guild-based commands
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

// for global commands
rest.put(Routes.applicationCommands(clientId), { body: [] })
	.then(() => console.log('Successfully deleted all application commands.'))
	.catch(console.error);
