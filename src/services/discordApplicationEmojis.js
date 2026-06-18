const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';
const RIFTBOUND_EMOJI_NAME_REGEX = /^rb_[a-z0-9_]{1,29}$/;

async function discordRequest(path, { token, method = 'GET', body } = {}) {
  if (!token) {
    throw new Error('Missing Discord bot token.');
  }

  const response = await fetch(`${DISCORD_API_BASE_URL}${path}`, {
    method,
    headers: {
      authorization: `Bot ${token}`,
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message ? `: ${data.message}` : '';
    throw new Error(`Discord API ${method} ${path} failed with HTTP ${response.status}${message}`);
  }

  return data;
}

export async function listApplicationEmojis({ applicationId, token }) {
  if (!applicationId) {
    throw new Error('Missing Discord application/client id.');
  }

  const data = await discordRequest(`/applications/${applicationId}/emojis`, { token });
  return Array.isArray(data?.items) ? data.items : [];
}

export async function createApplicationEmoji({ applicationId, token, name, image }) {
  if (!applicationId) {
    throw new Error('Missing Discord application/client id.');
  }

  return discordRequest(`/applications/${applicationId}/emojis`, {
    token,
    method: 'POST',
    body: { name, image }
  });
}

export function emojiToMention(emoji) {
  return `${emoji.animated ? '<a' : '<'}:${emoji.name}:${emoji.id}>`;
}

export function buildRiftboundEmojiMap(emojis = []) {
  return Object.fromEntries(
    emojis
      .filter((emoji) => emoji?.id && RIFTBOUND_EMOJI_NAME_REGEX.test(emoji.name ?? ''))
      .map((emoji) => [emoji.name, emojiToMention(emoji)])
  );
}
