import { config } from '../config.js';
import { fetchJson, fetchText } from './http.js';
import { scoreTextMatch } from '../utils/search.js';
import { normalizeForSearch, stripHtml } from '../utils/text.js';

const CARD_VERSION_URL = 'https://butterfly.dotgg.gg/?game=riftbound';
const CARD_LIST_URL = 'https://api.dotgg.gg/cgfw/getcards?game=riftbound';
const CARD_PAGE_BASE_URL = 'https://riftbound.gg/cards/';

let cache = {
  expiresAt: 0,
  cards: []
};

export function cardPageUrl(card) {
  return `${CARD_PAGE_BASE_URL}${card.slug}`;
}

export function normalizeCard(rawCard) {
  const colors = Array.isArray(rawCard.color)
    ? rawCard.color
    : String(rawCard.color ?? '')
        .split(',')
        .map((color) => color.trim())
        .filter(Boolean);

  return {
    id: rawCard.id,
    slug: rawCard.slug,
    name: rawCard.name,
    effect: stripHtml(rawCard.effect ?? ''),
    flavor: stripHtml(rawCard.flavor ?? ''),
    colors,
    cost: rawCard.cost,
    type: rawCard.type ?? rawCard.cardtype ?? '',
    supertype: rawCard.supertype ?? '',
    might: rawCard.might,
    tags: Array.isArray(rawCard.tags) ? rawCard.tags : [],
    setName: rawCard.set_name ?? rawCard.setName ?? '',
    rarity: rawCard.rarity ?? '',
    image: rawCard.image ?? '',
    imageBack: rawCard.image_back ?? '',
    banned: rawCard.banned === '1' || rawCard.banned === 1 || rawCard.banned === true,
    errata: stripHtml(rawCard.errata ?? ''),
    price: rawCard.price,
    foilPrice: rawCard.foilPrice
  };
}

async function getCardDataVersion() {
  const versionText = await fetchText(CARD_VERSION_URL, { timeoutMs: 8000 });
  const version = versionText.trim();

  return /^\d+$/.test(version) ? version : undefined;
}

export async function fetchAllCards({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cache.cards.length > 0 && cache.expiresAt > now) {
    return cache.cards;
  }

  let version;
  try {
    version = await getCardDataVersion();
  } catch {
    version = undefined;
  }

  const url = version ? `${CARD_LIST_URL}&cache=${version}` : CARD_LIST_URL;
  const cards = await fetchJson(url, { timeoutMs: 20000 });

  if (!Array.isArray(cards)) {
    throw new Error('Riftbound card API returned an unexpected response.');
  }

  cache = {
    expiresAt: now + config.cardCacheTtlMs,
    cards: cards.map(normalizeCard)
  };

  return cache.cards;
}

export function scoreCard(query, card) {
  return Math.max(
    scoreTextMatch(query, card.name),
    scoreTextMatch(query, card.id),
    scoreTextMatch(query, card.slug),
    scoreTextMatch(query, `${card.name} ${card.id} ${card.setName} ${card.type}`)
  );
}

export function searchCardsInList(cards, query, limit = 5) {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  return cards
    .map((card) => ({ card, score: scoreCard(query, card) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.card.name.localeCompare(b.card.name);
    })
    .slice(0, limit)
    .map((result) => result.card);
}

export async function searchCards(query, limit = 5) {
  const cards = await fetchAllCards();
  return searchCardsInList(cards, query, limit);
}
