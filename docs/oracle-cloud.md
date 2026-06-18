# Oracle Cloud Deployment

This bot works well on an Oracle Cloud Always Free VM because it is a long-lived
Discord Gateway process. It does not need a public HTTP port.

## Create The VM

1. Create or sign in to an Oracle Cloud account.
2. In your home region, create a Compute instance.
3. Use Ubuntu 24.04 LTS.
4. Prefer the Always Free `VM.Standard.A1.Flex` shape with 1 OCPU and 6 GB RAM.
   The smaller `VM.Standard.E2.1.Micro` shape can also work if A1 capacity is not
   available, but A1 has more room for Node and Docker.
5. Use a public subnet with a public IPv4 address so you can SSH in.
6. Add your SSH public key during instance creation.

Oracle images allow SSH by default. Do not open extra ingress ports for this bot.
It only needs outbound access to Discord, Riftbound/DotGG, and EloShowdown.

## SSH Into The VM

```bash
ssh -i /path/to/private-key ubuntu@YOUR_PUBLIC_IP
```

## Install Docker

Run these on the VM:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo ${UBUNTU_CODENAME:-$VERSION_CODENAME}) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## Clone The Bot

```bash
sudo mkdir -p /opt/riftbound-discord-bot
sudo chown ubuntu:ubuntu /opt/riftbound-discord-bot
git clone https://github.com/Yutrezz/ScuttleCrabBot.git /opt/riftbound-discord-bot
cd /opt/riftbound-discord-bot
```

If you deploy before pushing the latest local changes, clone will not include the
Docker and Oracle files. Push this repo first.

## Configure Secrets

```bash
cp .env.example .env
nano .env
```

Set at least:

```text
DISCORD_TOKEN=your bot token
DISCORD_CLIENT_ID=your application/client id
```

For production global commands, leave `DISCORD_GUILD_ID` blank or remove it. Set
it only when you want command registration to update instantly in one test server.

## Register Commands And Emoji

Run one-off commands through Docker Compose so they use the same image and env as
the running bot:

```bash
sudo docker compose build --pull
sudo docker compose run --rm bot pnpm deploy
sudo docker compose run --rm bot pnpm sync-emojis
```

Global Discord slash commands can take time to appear. Guild-scoped commands
appear much faster when `DISCORD_GUILD_ID` is set.

## Install The Systemd Service

```bash
sudo cp deployment/oracle/riftbound-discord-bot.service /etc/systemd/system/riftbound-discord-bot.service
sudo systemctl daemon-reload
sudo systemctl enable --now riftbound-discord-bot
```

Watch logs:

```bash
sudo journalctl -u riftbound-discord-bot -f
```

Check status:

```bash
sudo systemctl status riftbound-discord-bot
sudo docker compose ps
```

## Update Later

```bash
cd /opt/riftbound-discord-bot
git pull
sudo systemctl restart riftbound-discord-bot
```

The service rebuilds the Docker image before every start, so a restart after
`git pull` is enough to run the latest code.

## Notes

- Keep `.env` only on the VM. It is intentionally ignored by Git.
- Do not enable UFW on Oracle Ubuntu images unless you know the OCI-specific
  firewall caveat. Oracle documents that UFW can cause Ubuntu instances not to
  boot if it rewrites required rules.
- If `docker compose build` fails on an Ampere A1 VM, confirm you used a normal
  Ubuntu image, not Minimal Ubuntu. Oracle documents that Arm-based shapes should
  use Ubuntu rather than Minimal Ubuntu.
