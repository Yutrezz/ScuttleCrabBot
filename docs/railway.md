# Railway Deployment

This bot should be deployed as a long-running Railway service. It does not need a
public HTTP domain or healthcheck because it connects outbound to Discord's
Gateway.

## What Railway Uses

The checked-in `railway.json` tells Railway to:

- build with Railpack
- start the bot with `pnpm start`
- restart the service on failure, up to 10 retries

Railway detects pnpm from `packageManager` in `package.json`.

## Create The Service

1. Push this repository to GitHub.
2. Open Railway and create a new project.
3. Choose `Deploy from GitHub repo`.
4. Select this repository.
5. Do not generate a public domain. The bot does not serve HTTP traffic.

## Add Variables

In the Railway service, open `Variables` and add:

```text
DISCORD_TOKEN=your bot token
DISCORD_CLIENT_ID=your application/client id
LEADERBOARD_URL=https://www.eloshowdown.com/riftbound/leaderboard/singapore/
CARD_CACHE_TTL_MINUTES=360
LEADERBOARD_CACHE_TTL_SECONDS=300
```

Leave `DISCORD_GUILD_ID` blank for production global commands. Set it only when
you want command registration scoped to one test server.

After adding or changing variables, deploy the staged changes in Railway.

## Register Slash Commands

Slash commands only need to be registered when command definitions change.

If you have Railway CLI linked and authenticated:

```bash
railway run pnpm deploy
```

On Windows PowerShell, use `railway.cmd` if `railway` is blocked by script
execution policy:

```powershell
railway.cmd run pnpm deploy
```

If you do not want to use Railway CLI, you can also run this locally with your
local `.env`:

```bash
pnpm deploy
```

Global Discord slash commands can take time to appear. Guild-scoped commands
appear much faster when `DISCORD_GUILD_ID` is set.

## Sync Card Symbol Emoji

Run this once after variables are configured, and again later if Riftbound adds
new symbols:

```bash
railway run pnpm sync-emojis
```

Windows PowerShell:

```powershell
railway.cmd run pnpm sync-emojis
```

## Check Logs

The first successful start should log something like:

```text
Logged in as YourBotName#0000.
```

If the service crashes immediately, check that `DISCORD_TOKEN` and
`DISCORD_CLIENT_ID` are present in Railway variables.

