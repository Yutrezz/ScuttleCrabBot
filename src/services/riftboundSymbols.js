const CARD_SYMBOL_REGEX = /:([a-zA-Z0-9_]+):/g;
const DISCORD_EMOJI_NAME_REGEX = /^[a-z0-9_]{2,32}$/;
const RIFTBOUND_SYMBOL_PREFIX = 'rb_';
const SYMBOL_ASSET_BASE_URL = 'https://static.dotgg.gg/riftbound/text/';
const COLOR_ASSET_BASE_URL = 'https://static.dotgg.gg/riftbound/colors/';

export function normalizeSymbolName(value = '') {
  const name = String(value).replace(/^:|:$/g, '').toLowerCase();

  if (!name.startsWith(RIFTBOUND_SYMBOL_PREFIX)) return null;
  if (!DISCORD_EMOJI_NAME_REGEX.test(name)) return null;

  return name;
}

export function extractSymbolNamesFromText(value = '') {
  const names = new Set();
  const text = String(value);

  for (const match of text.matchAll(CARD_SYMBOL_REGEX)) {
    const name = normalizeSymbolName(match[1]);
    if (name) names.add(name);
  }

  return [...names].sort();
}

export function extractCardSymbolNames(cards = []) {
  const names = new Set();

  for (const card of cards) {
    for (const value of [card.effect, card.flavor, card.errata]) {
      for (const name of extractSymbolNamesFromText(value)) {
        names.add(name);
      }
    }
  }

  return [...names].sort();
}

export function symbolAssetUrl(name) {
  const symbolName = normalizeSymbolName(name);
  if (!symbolName) {
    throw new Error(`Invalid Riftbound symbol name: ${name}`);
  }

  return `${SYMBOL_ASSET_BASE_URL}${symbolName}.svg`;
}

export function symbolAssetCandidateUrls(name) {
  const symbolName = normalizeSymbolName(name);
  if (!symbolName) {
    throw new Error(`Invalid Riftbound symbol name: ${name}`);
  }

  const urls = [symbolAssetUrl(symbolName)];
  const runeColor = symbolName.match(/^rb_rune_([a-z]+)$/)?.[1];

  if (runeColor && runeColor !== 'rainbow') {
    urls.push(`${COLOR_ASSET_BASE_URL}${runeColor}.webp`);
  }

  return urls;
}

export function renderTextSymbols(value = '', symbolMap = {}) {
  return String(value).replace(CARD_SYMBOL_REGEX, (match, rawName) => {
    const name = normalizeSymbolName(rawName);
    return name && symbolMap[name] ? symbolMap[name] : match;
  });
}
