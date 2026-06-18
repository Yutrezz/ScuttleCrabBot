import { SlashCommandBuilder } from 'discord.js';
import { fetchSingaporeLeaderboard, searchPlayers } from '../services/eloShowdown.js';
import {
  buildPlayerEmbed,
  buildPlayerNoMatchEmbed,
  buildTopPlayersEmbeds
} from '../discord/embeds.js';

async function sendEmbedPages(interaction, embeds) {
  const [firstEmbed, ...remainingEmbeds] = embeds;

  await interaction.editReply({ embeds: [firstEmbed] });

  for (const embed of remainingEmbeds) {
    await interaction.followUp({ embeds: [embed] });
  }
}

export const playerCommand = {
  data: new SlashCommandBuilder()
    .setName('player')
    .setDescription('Look up Singapore Riftbound players or show the top leaderboard.')
    .addStringOption((option) =>
      option.setName('name').setDescription('Player name to search for.').setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('top')
        .setDescription('Show the top X leaderboard players.')
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(false)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', false);
    const top = interaction.options.getInteger('top', false);

    await interaction.deferReply();

    if (top) {
      const players = await fetchSingaporeLeaderboard();
      await sendEmbedPages(interaction, buildTopPlayersEmbeds(players.slice(0, top)));
      return;
    }

    if (!name) {
      const players = await fetchSingaporeLeaderboard();
      await sendEmbedPages(interaction, buildTopPlayersEmbeds(players.slice(0, 10)));
      return;
    }

    const matches = await searchPlayers(name, 6);
    if (matches.length === 0) {
      await interaction.editReply({ embeds: [buildPlayerNoMatchEmbed(name)] });
      return;
    }

    const [bestMatch, ...otherMatches] = matches;
    await interaction.editReply({
      embeds: [buildPlayerEmbed(bestMatch, otherMatches.slice(0, 5))]
    });
  }
};
