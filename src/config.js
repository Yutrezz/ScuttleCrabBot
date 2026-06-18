import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

loadDotEnv();

function loadDotEnv() {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  discordGuildId: process.env.DISCORD_GUILD_ID,
  rbMightEmoji: process.env.RB_MIGHT_EMOJI,
  leaderboardUrl:
    process.env.LEADERBOARD_URL ??
    'https://www.eloshowdown.com/riftbound/leaderboard/singapore/',
  cardCacheTtlMs:
    Number.parseInt(process.env.CARD_CACHE_TTL_MINUTES ?? '360', 10) *
    60 *
    1000,
  leaderboardCacheTtlMs:
    Number.parseInt(process.env.LEADERBOARD_CACHE_TTL_SECONDS ?? '300', 10) *
    1000
};

export function requireDiscordConfig() {
  const missing = [];

  if (!config.discordToken) missing.push('DISCORD_TOKEN');
  if (!config.discordClientId) missing.push('DISCORD_CLIENT_ID');

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`);
  }
}
