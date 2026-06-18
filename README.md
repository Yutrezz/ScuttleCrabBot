# Riftbound Discord Bot

A Discord slash-command bot for Riftbound:

- `/card query:<name or id>` looks up Riftbound cards using Riftbound.gg/DotGG card data.
  Searches with multiple matching variants show the best match image and list the other matches.
- `/player name:<player>` looks up a player's Singapore Riftbound ranking from EloShowdown.
- `/player top:<number>` shows up to 100 Singapore Riftbound leaderboard players, split across multiple messages when needed.

## Setup

1. Install Node.js 20 or newer.
2. Enable pnpm through Corepack:

```bash
corepack enable
corepack prepare pnpm@11.0.7 --activate
```

3. Create a Discord app and bot in the [Discord Developer Portal](https://discord.com/developers/applications).
4. Copy `.env.example` to `.env`.
5. Fill in `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`.
6. Optionally set `DISCORD_GUILD_ID` while testing so slash-command updates appear immediately in one server.
7. Install dependencies:

```bash
pnpm install
```

8. Register slash commands:

```bash
pnpm deploy
```

9. Sync Riftbound symbol emojis:

```bash
pnpm sync-emojis
```

10. Start the bot:

```bash
pnpm start
```

## Invite The Bot

In the Developer Portal, generate an OAuth2 URL with:

- Scopes: `bot`, `applications.commands`
- Bot permissions: no special permissions required for basic slash-command replies

Or use this URL after replacing `YOUR_CLIENT_ID`:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands&permissions=0
```

## Commands

```text
/card query:Jinx
/card query:UNL-131
/player name:your player name
/player top:10
```

## Custom Card Icons

Card text can render Riftbound symbols with Discord application emoji. This is better than server emoji because the icons belong to the bot app, not to one Discord server.

Run this after `.env` has `DISCORD_TOKEN` and `DISCORD_CLIENT_ID`:

```bash
pnpm sync-emojis
```

The sync command:

- scans current Riftbound card text for `:rb_*:` symbols
- fetches the matching SVGs from `https://static.dotgg.gg/riftbound/text/`
- converts them to Discord-compatible PNG application emoji
- uploads only missing emoji to the bot app

The bot then replaces matching symbols like `:rb_exhaust:`, `:rb_energy_2:`, and `:rb_might:` automatically. If Riftbound adds new symbols later, rerun `pnpm sync-emojis` and restart the bot.

If Corepack is not available on your machine, use:

```powershell
npx pnpm@11.0.7 run sync-emojis
```

The same `npx pnpm@11.0.7 ...` pattern works for `install`, `deploy`, `start`, and `test` if `pnpm` is not available globally.

## Verify Locally

```bash
pnpm test
```

## Data Sources

- Card data: `https://api.dotgg.gg/cgfw/getcards?game=riftbound`
- Card pages and images: `https://riftbound.gg/cards/`
- Singapore leaderboard: `https://www.eloshowdown.com/riftbound/leaderboard/singapore/`

The scraper is intentionally isolated in `src/services/eloShowdown.js` so it is easy to update if EloShowdown changes its HTML.
