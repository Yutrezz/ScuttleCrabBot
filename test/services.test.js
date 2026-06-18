import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCard, searchCardsInList } from '../src/services/riftboundCards.js';
import {
  buildCardEmbed,
  buildPlayerEmbed,
  buildTopPlayersEmbed,
  buildTopPlayersEmbeds,
  renderCardKeywords,
  renderCardText,
  renderCardSymbols
} from '../src/discord/embeds.js';
import { buildRiftboundEmojiMap } from '../src/services/discordApplicationEmojis.js';
import {
  extractCardSymbolNames,
  renderTextSymbols,
  symbolAssetCandidateUrls
} from '../src/services/riftboundSymbols.js';
import {
  parseSingaporeLeaderboard,
  searchPlayersInList
} from '../src/services/eloShowdown.js';

test('normalizes and searches Riftbound cards', () => {
  const cards = [
    normalizeCard({
      id: 'UNL-131',
      slug: 'unl-131-abandon',
      name: 'Abandon',
      effect: 'Counter a spell.<br />[Predict].',
      color: ['Chaos'],
      cost: '2',
      type: 'Spell',
      set_name: 'Unleashed',
      rarity: 'Uncommon',
      image: 'https://static.dotgg.gg/riftbound/cards/UNL-131.webp',
      banned: '0'
    }),
    normalizeCard({
      id: 'OGN-001',
      slug: 'ogn-001-jinx',
      name: 'Jinx',
      effect: 'Deal damage.',
      color: ['Fury'],
      cost: '3',
      type: 'Legend',
      set_name: 'Origins',
      rarity: 'Rare',
      banned: '0'
    })
  ];

  assert.equal(cards[0].effect, 'Counter a spell.\n[Predict].');
  assert.equal(searchCardsInList(cards, 'jinx', 1)[0].id, 'OGN-001');
  assert.equal(searchCardsInList(cards, 'UNL-131', 1)[0].name, 'Abandon');
});

test('normalizes Riftbound card lists into Discord bullet lines', () => {
  const card = normalizeCard({
    id: 'UNL-080',
    slug: 'unl-080-hwei-brooding-painter',
    name: 'Hwei - Brooding Painter',
    effect:
      'When I move, draw 1, then discard 1. Then, do the following based on the discarded card\'s type:<ul><li><strong>Spell</strong> — Draw 1.</li><li><strong>Gear</strong> — Ready up to 2 runes.</li><li><strong>Unit</strong> — Give me +3 :rb_might: this turn.</li></ul>'
  });

  assert.equal(
    card.effect,
    "When I move, draw 1, then discard 1. Then, do the following based on the discarded card's type:\n- Spell — Draw 1.\n- Gear — Ready up to 2 runes.\n- Unit — Give me +3 :rb_might: this turn."
  );
});

test('renders configured Riftbound card symbols', () => {
  assert.equal(
    renderCardSymbols(':rb_exhaust:: [Add] :rb_energy_2:.', {
      symbolMap: {
        rb_exhaust: '<:rb_exhaust:111111111111111111>',
        rb_energy_2: '<:rb_energy_2:222222222222222222>'
      }
    }),
    '<:rb_exhaust:111111111111111111>: [Add] <:rb_energy_2:222222222222222222>.'
  );

  assert.equal(
    renderTextSymbols('Keep :rb_unknown: readable.', {}),
    'Keep :rb_unknown: readable.'
  );
});

test('formats Riftbound keyword markup for card text', () => {
  assert.equal(
    renderCardKeywords('[Deathknell][>] Choose an opponent. [Predict 2].'),
    '`Deathknell` > Choose an opponent. `Predict 2`.'
  );
  assert.equal(
    renderCardKeywords(':rb_exhaust:: [Reaction] - [Add] :rb_energy_2:.'),
    ':rb_exhaust:: `Reaction` - `Add` :rb_energy_2:.'
  );
  assert.equal(
    renderCardKeywords('[Level 6][>] [>>][Reaction][>] Use this ability.'),
    '`Level 6` > >> `Reaction` > Use this ability.'
  );
  assert.equal(
    renderCardKeywords('Give a unit [Assault 4] and [Shield 2].'),
    'Give a unit `Assault 4` and `Shield 2`.'
  );
});

test('renders card text with symbols and keyword chips', () => {
  assert.equal(
    renderCardText(':rb_exhaust:: [Reaction] - [Add] :rb_energy_2:.', {
      symbolMap: {
        rb_exhaust: '<:rb_exhaust:111111111111111111>',
        rb_energy_2: '<:rb_energy_2:222222222222222222>'
      }
    }),
    '<:rb_exhaust:111111111111111111>: `Reaction` - `Add` <:rb_energy_2:222222222222222222>.'
  );
});

test('extracts Riftbound symbols and builds emoji maps', () => {
  const symbols = extractCardSymbolNames([
    normalizeCard({
      effect: ':rb_exhaust:: [Reaction] - [Add] :rb_energy_2:.',
      errata: 'Gains :rb_might:.'
    })
  ]);

  assert.deepEqual(symbols, ['rb_energy_2', 'rb_exhaust', 'rb_might']);
  assert.deepEqual(
    buildRiftboundEmojiMap([
      { id: '1', name: 'rb_exhaust', animated: false },
      { id: '2', name: 'not_riftbound', animated: false }
    ]),
    { rb_exhaust: '<:rb_exhaust:1>' }
  );
  assert.deepEqual(symbolAssetCandidateUrls('rb_rune_order'), [
    'https://static.dotgg.gg/riftbound/text/rb_rune_order.svg',
    'https://static.dotgg.gg/riftbound/colors/order.webp'
  ]);
});

test('builds one card embed with first match image and text-only other matches', () => {
  const embed = buildCardEmbed(
    normalizeCard({
      id: 'OGS-014',
      slug: 'ogs-014-lux-crownguard',
      name: 'Lux - Crownguard',
      effect: 'Add resources.',
      image: 'https://static.dotgg.gg/riftbound/cards/OGS-014.webp'
    }),
    [
      normalizeCard({
        id: 'OGS-014-P',
        slug: 'ogs-014-p-lux-crownguard',
        name: 'Lux - Crownguard (Spiritforged Nexus Night Promo)',
        image: 'https://static.dotgg.gg/riftbound/cards/OGS-014-P.webp'
      })
    ]
  ).toJSON();

  assert.equal(embed.image.url, 'https://static.dotgg.gg/riftbound/cards/OGS-014.webp');
  assert.ok(
    embed.fields
      .find((field) => field.name === 'Other Matches')
      .value.includes('Lux - Crownguard (Spiritforged Nexus Night Promo)')
  );
});

test('colors embeds by card type and bot command domain', () => {
  const cardCases = [
    { color: ['Fury'], expected: 0xe53935 },
    { color: ['Body'], expected: 0xf97316 },
    { color: ['Order'], expected: 0xfacc15 },
    { color: ['Calm'], expected: 0x22c55e },
    { color: ['Mind'], expected: 0x3b82f6 },
    { color: ['Chaos'], expected: 0x8b5cf6 },
    { color: ['Fury', 'Mind'], expected: 0xd4af37 },
    { color: [], type: 'Battlefield', expected: 0x64748b }
  ];

  for (const { color, type = 'Unit', expected } of cardCases) {
    const embed = buildCardEmbed(
      normalizeCard({
        id: `TEST-${expected}`,
        slug: `test-${expected}`,
        name: `Test ${expected}`,
        color,
        type,
        effect: 'Test.'
      })
    ).toJSON();

    assert.equal(embed.color, expected);
  }

  const player = {
    rank: '1',
    name: 'Sequinox',
    profileUrl: 'https://www.eloshowdown.com/riftbound/player/1/',
    elo: '1369',
    tier: 'Master',
    record: '10-1-0',
    winRate: '90.9%',
    matches: '11'
  };

  assert.equal(buildPlayerEmbed(player).toJSON().color, 0x14532d);
  assert.equal(buildTopPlayersEmbed([player]).toJSON().color, 0x14532d);
});

test('parses and searches EloShowdown leaderboard rows', () => {
  const html = `
    <table>
      <tr class="leaderboard-row" data-name="testplayer">
        <td class="col-rank"><span class="rk ">12</span></td>
        <td class="player-col">
          <div class="player-cell">
            <img src="/static/images/ranked_icons/emblems/gold.png" alt="gold" class="rank-icon-leaderboard" title="Gold" width="20" height="20">
            <div><a href="/riftbound/player/123/season-3-unleashed/" class="pname">TestPlayer</a></div>
          </div>
        </td>
        <td class="col-elo"><span class="elo-badge elo-mid">1042</span></td>
        <td class="col-wld"><span class="wld"><span class="result-win">8</span>-<span class="result-loss">4</span>-<span class="result-draw">1</span></span></td>
        <td class="col-win"><div><span class="wn win-hi">66.7%</span></div></td>
        <td class="col-matches matches-cell">13</td>
      </tr>
    </table>
  `;

  const players = parseSingaporeLeaderboard(html);

  assert.equal(players.length, 1);
  assert.equal(players[0].name, 'TestPlayer');
  assert.equal(players[0].rank, '12');
  assert.equal(players[0].elo, '1042');
  assert.equal(players[0].record, '8-4-1');
  assert.equal(players[0].tier, 'Gold');
  assert.equal(searchPlayersInList(players, 'test', 1)[0].name, 'TestPlayer');
});

test('builds top players leaderboard embed', () => {
  const embed = buildTopPlayersEmbed([
    {
      rank: '1',
      name: 'Sequinox',
      profileUrl: 'https://www.eloshowdown.com/riftbound/player/1/',
      elo: '1369',
      record: '10-1-0',
      winRate: '90.9%'
    },
    {
      rank: '2',
      name: 'lambyseries',
      profileUrl: 'https://www.eloshowdown.com/riftbound/player/2/',
      elo: '1360',
      record: '9-2-0',
      winRate: '81.8%'
    }
  ]).toJSON();

  assert.equal(embed.title, 'Top 2 Singapore Riftbound Players');
  assert.ok(embed.description.includes('#1 [Sequinox]'));
  assert.ok(embed.description.includes('1360 ELO'));
});

test('splits large top player leaderboards across embeds', () => {
  const players = Array.from({ length: 50 }, (_, index) => ({
    rank: String(index + 1),
    name: `Player${index + 1}`,
    profileUrl: `https://www.eloshowdown.com/riftbound/player/${index + 1}/`,
    elo: String(1400 - index),
    record: '1-0-0',
    winRate: '100%'
  }));
  const embeds = buildTopPlayersEmbeds(players).map((embed) => embed.toJSON());

  assert.equal(embeds.length, 2);
  assert.equal(embeds[0].title, 'Top 50 Singapore Riftbound Players (1-25)');
  assert.equal(embeds[1].title, 'Top 50 Singapore Riftbound Players (26-50)');
  assert.ok(embeds[1].description.includes('#50 [Player50]'));

  for (const embed of embeds) {
    assert.ok(JSON.stringify(embed).length < 6000);
  }
});
