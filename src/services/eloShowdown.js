import { config } from '../config.js';
import { fetchText } from './http.js';
import { scoreTextMatch } from '../utils/search.js';
import { decodeHtmlEntities, normalizeForSearch, stripHtml } from '../utils/text.js';

let cache = {
  expiresAt: 0,
  players: []
};

function firstMatch(value, regex) {
  const match = value.match(regex);
  return match ? match[1] : '';
}

function absoluteUrl(pathOrUrl) {
  return new URL(pathOrUrl, config.leaderboardUrl).href;
}

export function parseSingaporeLeaderboard(html) {
  const players = [];
  const rowRegex =
    /<tr\s+class="leaderboard-row"[^>]*data-name="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of html.matchAll(rowRegex)) {
    const [, dataName, rowHtml] = rowMatch;
    const rank = stripHtml(firstMatch(rowHtml, /<td\s+class="col-rank">([\s\S]*?)<\/td>/i));
    const playerLink = rowHtml.match(/<a\s+href="([^"]+)"\s+class="pname">([\s\S]*?)<\/a>/i);

    if (!rank || !playerLink) continue;

    const [, href, nameHtml] = playerLink;
    const elo = stripHtml(firstMatch(rowHtml, /<td\s+class="col-elo">([\s\S]*?)<\/td>/i));
    const record = stripHtml(firstMatch(rowHtml, /<td\s+class="col-wld">([\s\S]*?)<\/td>/i));
    const winRate = stripHtml(firstMatch(rowHtml, /<td\s+class="col-win">([\s\S]*?)<\/td>/i));
    const matches = stripHtml(
      firstMatch(rowHtml, /<td\s+class="col-matches[^"]*">([\s\S]*?)<\/td>/i)
    );
    const tier = decodeHtmlEntities(
      firstMatch(rowHtml, /class="rank-icon-leaderboard"[^>]*title="([^"]*)"/i)
    );

    players.push({
      rank,
      name: stripHtml(nameHtml) || decodeHtmlEntities(dataName),
      lookupName: decodeHtmlEntities(dataName),
      elo,
      record: record.replace(/\s+/g, ''),
      winRate: winRate.replace(/\s+/g, ' '),
      matches: matches.replace(/\s+/g, ' '),
      tier,
      profileUrl: absoluteUrl(href)
    });
  }

  return players;
}

export async function fetchSingaporeLeaderboard({ forceRefresh = false } = {}) {
  const now = Date.now();
  if (!forceRefresh && cache.players.length > 0 && cache.expiresAt > now) {
    return cache.players;
  }

  const html = await fetchText(config.leaderboardUrl, { timeoutMs: 20000 });
  const players = parseSingaporeLeaderboard(html);

  if (players.length === 0) {
    throw new Error('No players were found on the EloShowdown leaderboard page.');
  }

  cache = {
    expiresAt: now + config.leaderboardCacheTtlMs,
    players
  };

  return cache.players;
}

export function scorePlayer(query, player) {
  return Math.max(scoreTextMatch(query, player.name), scoreTextMatch(query, player.lookupName));
}

export function searchPlayersInList(players, query, limit = 5) {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  return players
    .map((player) => ({ player, score: scorePlayer(query, player) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const rankA = Number.parseInt(a.player.rank, 10) || Number.MAX_SAFE_INTEGER;
      const rankB = Number.parseInt(b.player.rank, 10) || Number.MAX_SAFE_INTEGER;
      return rankA - rankB;
    })
    .slice(0, limit)
    .map((result) => result.player);
}

export async function searchPlayers(query, limit = 5) {
  const players = await fetchSingaporeLeaderboard();
  return searchPlayersInList(players, query, limit);
}
