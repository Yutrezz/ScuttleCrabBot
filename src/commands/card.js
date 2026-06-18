import { SlashCommandBuilder } from 'discord.js';
import { searchCards } from '../services/riftboundCards.js';
import { buildCardEmbed, buildCardNoMatchEmbed } from '../discord/embeds.js';
import { getRiftboundEmojiMap } from '../services/riftboundEmojiMap.js';

export const cardCommand = {
  data: new SlashCommandBuilder()
    .setName('card')
    .setDescription('Look up a Riftbound card by name, slug, or card id.')
    .addStringOption((option) =>
      option
        .setName('query')
        .setDescription('Card name or id, for example Jinx or UNL-131.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query', true);

    await interaction.deferReply();

    const matches = await searchCards(query, 6);
    if (matches.length === 0) {
      await interaction.editReply({ embeds: [buildCardNoMatchEmbed(query)] });
      return;
    }

    const [bestMatch, ...otherMatches] = matches;
    const symbolMap = await getRiftboundEmojiMap();

    await interaction.editReply({
      embeds: [buildCardEmbed(bestMatch, otherMatches.slice(0, 5), { symbolMap })]
    });
  }
};
