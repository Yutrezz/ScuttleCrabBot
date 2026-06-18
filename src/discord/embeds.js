import { EmbedBuilder } from 'discord.js';
import { cardPageUrl } from '../services/riftboundCards.js';
import { renderTextSymbols } from '../services/riftboundSymbols.js';
import { truncate } from '../utils/text.js';

const COLOR_HEX = {
  Fury: 0xe53935,
  Body: 0xf97316,
  Order: 0xfacc15,
  Calm: 0x22c55e,
  Mind: 0x3b82f6,
  Chaos: 0x8b5cf6
};

const SCUTTLE_COLOR = 0x14532d;
const BATTLEFIELD_COLOR = 0x64748b;
const MULTICOLOR_CARD_COLOR = 0xd4af37;
const COLORLESS_CARD_COLOR = 0x94a3b8;

function cardColor(card) {
  const colors = card.colors ?? [];
  const typeText = [card.supertype, card.type].filter(Boolean).join(' ').toLowerCase();

  if (typeText.includes('battlefield')) return BATTLEFIELD_COLOR;
  if (colors.length > 1) return MULTICOLOR_CARD_COLOR;

  return COLOR_HEX[colors[0]] ?? COLORLESS_CARD_COLOR;
}

export function renderCardSymbols(value = '', symbols = {}) {
  const symbolMap = { ...(symbols.symbolMap ?? symbols) };

  if (symbols.rbMightEmoji && !symbolMap.rb_might) {
    symbolMap.rb_might = symbols.rbMightEmoji;
  }

  return renderTextSymbols(value, symbolMap);
}

export function buildCardEmbed(card, otherMatches = [], options = {}) {
  const symbolMap = options.symbolMap ?? {};
  const typeLine = [card.supertype, card.type].filter(Boolean).join(' ');
  const fields = [
    { name: 'Cost', value: card.cost || '-', inline: true },
    { name: 'Might', value: card.might ? String(card.might) : '-', inline: true },
    { name: 'Color', value: card.colors?.join(', ') || 'Colorless', inline: true },
    { name: 'Type', value: typeLine || '-', inline: true },
    { name: 'Set', value: card.setName || '-', inline: true },
    { name: 'Rarity', value: card.rarity || '-', inline: true }
  ];

  const status = [];
  if (card.banned) status.push('Banned');
  if (card.errata) {
    status.push(`Errata: ${truncate(renderCardSymbols(card.errata, { symbolMap }), 220)}`);
  }
  if (card.imageBack) status.push('Has a back side');

  if (status.length > 0) {
    fields.push({ name: 'Status', value: status.join('\n'), inline: false });
  }

  if (otherMatches.length > 0) {
    fields.push({
      name: 'Other Matches',
      value: otherMatches
        .map((match) => `[${match.name} (${match.id})](${cardPageUrl(match)})`)
        .join('\n'),
      inline: false
    });
  }

  const embed = new EmbedBuilder()
    .setColor(cardColor(card))
    .setTitle(`${card.name} (${card.id})`)
    .setURL(cardPageUrl(card))
    .setDescription(
      truncate(
        renderCardSymbols(card.effect || card.flavor || 'No card text found.', { symbolMap }),
        3800
      )
    )
    .addFields(fields)
    .setFooter({ text: 'Source: Riftbound.gg / DotGG' });

  if (card.image) embed.setImage(card.image);

  return embed;
}

export function buildCardNoMatchEmbed(query) {
  return new EmbedBuilder()
    .setColor(0xe84057)
    .setTitle('No Card Found')
    .setDescription(`I could not find a Riftbound card matching "${truncate(query, 120)}".`);
}

export function buildPlayerEmbed(player, otherMatches = []) {
  const fields = [
    { name: 'Rank', value: `#${player.rank}`, inline: true },
    { name: 'ELO', value: player.elo || '-', inline: true },
    { name: 'Tier', value: player.tier || '-', inline: true },
    { name: 'Record', value: player.record || '-', inline: true },
    { name: 'Win Rate', value: player.winRate || '-', inline: true },
    { name: 'Matches', value: player.matches || '-', inline: true }
  ];

  if (otherMatches.length > 0) {
    fields.push({
      name: 'Other Matches',
      value: otherMatches
        .map((match) => `#${match.rank} [${match.name}](${match.profileUrl}) (${match.elo} ELO)`)
        .join('\n'),
      inline: false
    });
  }

  return new EmbedBuilder()
    .setColor(SCUTTLE_COLOR)
    .setTitle(`${player.name} - Singapore Riftbound`)
    .setURL(player.profileUrl)
    .addFields(fields)
    .setFooter({ text: 'Source: EloShowdown Singapore leaderboard' });
}

export function buildPlayerNoMatchEmbed(query) {
  return new EmbedBuilder()
    .setColor(0xe84057)
    .setTitle('No Player Found')
    .setDescription(
      `I could not find a Singapore leaderboard player matching "${truncate(query, 120)}".`
    );
}

export function buildTopPlayersEmbed(players = []) {
  const lines = players.map((player) => {
    const rank = player.rank ? `#${player.rank}` : '-';
    const elo = player.elo ? `${player.elo} ELO` : 'No ELO';
    const record = player.record ? ` | ${player.record}` : '';
    const winRate = player.winRate ? ` | ${player.winRate}` : '';

    return `${rank} [${player.name}](${player.profileUrl}) - ${elo}${record}${winRate}`;
  });

  return new EmbedBuilder()
    .setColor(SCUTTLE_COLOR)
    .setTitle(`Top ${players.length} Singapore Riftbound Players`)
    .setURL('https://www.eloshowdown.com/riftbound/leaderboard/singapore/')
    .setDescription(truncate(lines.join('\n') || 'No leaderboard players found.', 3800))
    .setFooter({ text: 'Source: EloShowdown Singapore leaderboard' });
}

export function buildTopPlayersEmbeds(players = [], playersPerEmbed = 25) {
  if (players.length === 0) {
    return [buildTopPlayersEmbed([])];
  }

  const embeds = [];

  for (let index = 0; index < players.length; index += playersPerEmbed) {
    const chunk = players.slice(index, index + playersPerEmbed);
    const embed = buildTopPlayersEmbed(chunk);
    const from = index + 1;
    const to = index + chunk.length;

    embed.setTitle(
      players.length === chunk.length
        ? `Top ${players.length} Singapore Riftbound Players`
        : `Top ${players.length} Singapore Riftbound Players (${from}-${to})`
    );

    embeds.push(embed);
  }

  return embeds;
}
