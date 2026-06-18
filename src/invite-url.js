import { config } from './config.js';

if (!config.discordClientId) {
  throw new Error('Missing required environment variable: DISCORD_CLIENT_ID');
}

const scopes = ['bot', 'applications.commands'];
const permissions = '0';
const inviteUrl =
  `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(
    config.discordClientId
  )}&scope=${scopes.map(encodeURIComponent).join('%20')}&permissions=${permissions}`;

console.log(inviteUrl);
