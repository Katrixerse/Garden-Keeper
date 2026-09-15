const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const ms = require('ms');
const { ensureGiveawayTables, createGiveaway, getGiveawayByMessageId, finishGiveaway, rerollGiveaway, listActive } = require('../Handlers/giveawayHandlers/giveawayManager.js');
const { announceWinners } = require('../Handlers/giveawayHandlers/GiveawayScheduler.js');

function parseMessageId(input) {
  if (!input) return null;
  const m = input.match(/\d{17,20}$/);
  return m ? m[0] : null;
}

function winnersText(ids) {
  if (!ids.length) return 'No valid entries.';
  return ids.map(id => `<@${id}>`).join(', ');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Manage giveaways')
    .addSubcommand(sub =>
      sub
        .setName('start')
        .setDescription('Start a giveaway. Users enter by reacting with 🎉.')
        .addStringOption(o =>
          o.setName('duration')
            .setDescription('Duration (e.g. 1h, 30m, 2d)')
            .setRequired(true)
        )
        .addIntegerOption(o =>
          o.setName('winners')
            .setDescription('Number of winners (1-20)')
            .setMinValue(1)
            .setMaxValue(20)
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName('prize')
            .setDescription('Prize (2-200 chars)')
            .setMinLength(2)
            .setMaxLength(200)
            .setRequired(true)
        )
        .addChannelOption(o =>
          o.setName('channel')
            .setDescription('Channel to post the giveaway (defaults to current)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('end')
        .setDescription('End a giveaway early and pick winners.')
        .addStringOption(o =>
          o.setName('message')
            .setDescription('Message ID or link to the giveaway message')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('reroll')
        .setDescription('Reroll winners for a giveaway.')
        .addStringOption(o =>
          o.setName('message')
            .setDescription('Message ID or link to the giveaway message')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('List active giveaways in this server.')
    ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    }

    try {
      if (sub === 'start') {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: 'You need Manage Server to start a giveaway.', flags: MessageFlags.Ephemeral });
        }

        const durationArg = interaction.options.getString('duration', true);
        const winnersCount = interaction.options.getInteger('winners', true);
        const prize = interaction.options.getString('prize', true);
        const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

        const durationMs = ms(durationArg);
        if (!durationMs || durationMs < 10_000) {
          return interaction.reply({ content: 'Duration is invalid (min 10s).', flags: MessageFlags.Ephemeral });
        }
        if (prize.length < 2 || prize.length > 200) {
          return interaction.reply({ content: 'Prize must be 2-200 characters.', flags: MessageFlags.Ephemeral });
        }

        await ensureGiveawayTables();

        const endsAt = Date.now() + durationMs;
        const embed = new EmbedBuilder()
          .setColor('#F49A32')
          .setTitle('🎉 New Giveaway')
          .setDescription(`Prize: ${prize}`)
          .addFields(
            { name: 'Hosted by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Winners', value: `${winnersCount}`, inline: true },
            { name: 'Ends', value: `<t:${Math.floor(endsAt / 1000)}:R>`, inline: true }
          )
          .setFooter({ text: 'React with 🎉 to enter!' })
          .setTimestamp();

        const msg = await targetChannel.send({ embeds: [embed] }).catch(() => null);
        if (!msg) return interaction.reply({ content: 'Failed to create the giveaway message.', flags: MessageFlags.Ephemeral });

        await msg.react('🎉').catch(() => {});

        await createGiveaway({
          guildId: interaction.guild.id,
          channelId: targetChannel.id,
          messageId: msg.id,
          hostId: interaction.user.id,
          prize,
          winnersCount,
          endsAt,
        });

        return interaction.reply({
          content: `Giveaway started in <#${targetChannel.id}>. Jump: https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${msg.id}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (sub === 'end') {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: 'You need Manage Server to end giveaways.', flags: MessageFlags.Ephemeral });
        }

        const raw = interaction.options.getString('message', true);
        const id = parseMessageId(raw);
        if (!id) return interaction.reply({ content: 'Please provide a valid message ID or link.', flags: MessageFlags.Ephemeral });

        const g = await getGiveawayByMessageId(id);
        if (!g) return interaction.reply({ content: 'Giveaway not found.', flags: MessageFlags.Ephemeral });

        const { giveaway, winners, roll } = await finishGiveaway(g.id);
        await announceWinners(interaction.client, giveaway, winners, roll);

        return interaction.reply({
          content: `Giveaway ended. Winners: ${winnersText(winners)}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (sub === 'reroll') {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: 'You need Manage Server to reroll giveaways.', flags: MessageFlags.Ephemeral });
        }

        const raw = interaction.options.getString('message', true);
        const id = parseMessageId(raw);
        if (!id) return interaction.reply({ content: 'Please provide a valid message ID or link.', flags: MessageFlags.Ephemeral });

        const g = await getGiveawayByMessageId(id);
        if (!g) return interaction.reply({ content: 'Giveaway not found.', flags: MessageFlags.Ephemeral });

        const { winners, roll } = await rerollGiveaway(g.id);
        await announceWinners(interaction.client, g, winners, roll);

        return interaction.reply({
          content: `Rerolled. New winners: ${winnersText(winners)} (roll ${roll})`,
          flags: MessageFlags.Ephemeral,
        });
      }

      if (sub === 'list') {
        const rows = await listActive(interaction.guild.id, 10);
        if (!rows.length) {
          return interaction.reply({ content: 'No active giveaways.', flags: MessageFlags.Ephemeral });
        }

        const lines = rows.map((g, i) =>
          `#${i + 1} • <#${g.channelId}> • [jump](https://discord.com/channels/${interaction.guild.id}/${g.channelId}/${g.messageId}) • Prize: ${g.prize} • Ends: <t:${g.endsUnix}:R>`
        );

        const embed = new EmbedBuilder()
          .setColor('#00BFFF')
          .setTitle('Active Giveaways')
          .setDescription(lines.join('\n'))
          .setTimestamp();

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error('giveaway slash error:', err);
      return interaction.reply({ content: 'Something went wrong processing this giveaway command.', flags: MessageFlags.Ephemeral });
    }
  },
};