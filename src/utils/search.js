import { normalizeForSearch } from './text.js';

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost
      );
    }

    for (let j = 0; j <= b.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

export function scoreTextMatch(query, candidate) {
  const normalizedQuery = normalizeForSearch(query);
  const normalizedCandidate = normalizeForSearch(candidate);

  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedQuery) return 1000;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 850;
  if (normalizedCandidate.includes(normalizedQuery)) return 700;

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);
  if (queryTokens.length > 0 && queryTokens.every((token) => candidateTokens.includes(token))) {
    return 650;
  }

  const distance = levenshtein(normalizedQuery, normalizedCandidate);
  const maxLength = Math.max(normalizedQuery.length, normalizedCandidate.length);
  const similarity = maxLength === 0 ? 0 : 1 - distance / maxLength;

  return similarity >= 0.68 ? Math.round(similarity * 550) : 0;
}
