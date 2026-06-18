import { config } from '../config.js';
import { buildRiftboundEmojiMap, listApplicationEmojis } from './discordApplicationEmojis.js';

const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = {
  expiresAt: 0,
  map: {}
};

function fallbackEmojiMap() {
  return config.rbMightEmoji ? { rb_might: config.rbMightEmoji } : {};
}

export async function getRiftboundEmojiMap({ forceRefresh = false } = {}) {
  const fallback = fallbackEmojiMap();
  const now = Date.now();

  if (!forceRefresh && cache.expiresAt > now) {
    return { ...fallback, ...cache.map };
  }

  if (!config.discordToken || !config.discordClientId) {
    return fallback;
  }

  try {
    const emojis = await listApplicationEmojis({
      applicationId: config.discordClientId,
      token: config.discordToken
    });

    cache = {
      expiresAt: now + CACHE_TTL_MS,
      map: buildRiftboundEmojiMap(emojis)
    };

    return { ...fallback, ...cache.map };
  } catch (error) {
    console.warn(`Could not load Discord application emojis: ${error.message}`);
    return fallback;
  }
}
