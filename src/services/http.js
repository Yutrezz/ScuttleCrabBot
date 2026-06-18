const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT =
  'riftbound-discord-bot/0.1 (+https://riftbound.gg; Discord bot card and ranking lookup)';

export async function fetchText(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers = {},
    signal: externalSignal,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
        ...headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText} from ${url}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson(url, options = {}) {
  const text = await fetchText(url, {
    ...options,
    headers: {
      accept: 'application/json,text/plain;q=0.9,*/*;q=0.8',
      ...(options.headers ?? {})
    }
  });

  if (!text.trim()) return null;
  return JSON.parse(text);
}
