import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { config, requireDiscordConfig } from './config.js';

requireDiscordConfig();

const rest = new REST({ version: '10' }).setToken(config.discordToken);
const commandPayload = commands.map((command) => command.data.toJSON());

if (config.discordGuildId) {
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: commandPayload }
  );
  console.log(`Registered ${commandPayload.length} guild command(s).`);
} else {
  await rest.put(Routes.applicationCommands(config.discordClientId), {
    body: commandPayload
  });
  console.log(`Registered ${commandPayload.length} global command(s).`);
}
