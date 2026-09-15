const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const { ensureGiveawayTables, createGiveaway, getGiveawayByMessageId, finishGiveaway, rerollGiveaway, listActive } = require('../../Handlers/giveawayHandlers/giveawayManager.js');
const { announceWinners } = require('../../Handlers/giveawayHandlers/GiveawayScheduler.js');

function parseMessageId(input) {
  if (!input) return null;
  const m = input.match(/\d{17,20}$/);
  return m ? m[0] : null;
}

function winnersText(ids) {
  if (!ids.length) return 'No valid entries.';
  return ids.map(id => `<@${id}>`).join(', ');
}

function resolveChannelFromEnd(restArgs, message) {
  if (!restArgs.length) return { channel: message.channel, restArgs };
  const last = restArgs[restArgs.length - 1];

  const mentionMatch = last.match(/^<#(\d{17,20})>$/);
  const id = mentionMatch ? mentionMatch[1] : (/^\d{17,20}$/.test(last) ? last : null);

  const channel = id ? message.guild.channels.cache.get(id) : null;
  if (channel) {
    return { channel, restArgs: restArgs.slice(0, -1) };
  }
  return { channel: message.channel, restArgs };
}

module.exports = {
  name: 'giveaway',
  aliases: ['gaw', 'ga'],
  description: 'Manage giveaways: start, end, reroll, list. Uses a modal to set up and buttons for entry',
  usage: 'g!giveaway',
  cooldownTime: '3',
  group: 'giveaway',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if (!message.guild) return;

    const manageEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Manage giveaways')
      .setDescription('Click one of the button below.');

    const startGiveaway = new ButtonBuilder()
      .setCustomId('start')
      .setLabel('Start Giveaway')
      .setStyle(ButtonStyle.Primary);

    const endGiveaway = new ButtonBuilder()
      .setCustomId('end')
      .setLabel('End Giveaway')
      .setStyle(ButtonStyle.Secondary);

    const rerollGiveaway = new ButtonBuilder()
      .setCustomId('reroll')
      .setLabel('Reroll Giveaway')
      .setStyle(ButtonStyle.Secondary);

    const listGiveaway = new ButtonBuilder()
      .setCustomId('list')
      .setLabel('List Giveaways')
      .setStyle(ButtonStyle.Secondary);


    const row = new ActionRowBuilder()
      .addComponents(startGiveaway, endGiveaway, rerollGiveaway, listGiveaway);

    const initialMessage = await message.channel.send({
      embeds: [manageEmbed],
      components: [row]
    });

    if (!initialMessage) {
      return message.channel.send("Failed to send the initial message. Please try again later.");
    }

    const filter = (i) => i.user.id === message.author.id && i.message.id === initialMessage.id;
    const collector = initialMessage.createMessageComponentCollector({
      filter,
      time: 60000
    });

    collector.on("collect", async (interaction) => {
      // Buttons -> present a select
      if (interaction.customId === "start") {
        // Present the start giveaway modal
        await interaction.showModal({
          customId: 'start_giveaway',
          title: 'Start Giveaway',
          components: [
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('duration')
                .setLabel('Duration')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g. 1h')
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('winners')
                .setLabel('Number of Winners')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g. 1')
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('prize')
                .setLabel('Prize')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('What is the prize?')
                .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('channel')
                .setLabel('Channel')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('e.g. #giveaways')
                .setRequired(true)
            )
          ]
        });

        await interaction.awaitModalSubmit({ time: 120000 }).then(async (modalInteraction) => {
          const duration = modalInteraction.fields.getTextInputValue('duration');
          const winners = modalInteraction.fields.getTextInputValue('winners');
          const prize = modalInteraction.fields.getTextInputValue('prize');
          const modalChannel = modalInteraction.fields.getTextInputValue('channel');

          // Validate and start the giveaway
          if (!duration || !winners || !prize || !modalChannel) {
            return modalInteraction.reply('Please fill in all fields.');
          }

          const winnersCount = Number(winners);
          const durationMs = parseInt(ms(duration));

          if (durationMs < 10000 || durationMs > 604800000) return modalInteraction.reply('Duration is invalid (min 10s, max 7d).');
          if (!Number.isInteger(winnersCount) || winnersCount < 1 || winnersCount > 50) return modalInteraction.reply('Winners must be between 1 and 50.');
          if (prize.length < 2 || prize.length > 200) return modalInteraction.reply('Prize must be 2-200 characters.');

          // Validate channel
          const getChannel = message.guild.channels.cache.find(ch => ch.name === modalChannel)
          if (!getChannel) return modalInteraction.reply('Invalid channel.');

          const endsAt = Date.now() + durationMs;
          const embed = new EmbedBuilder()
            .setColor('#F49A32')
            .setTitle('🎉 New Giveaway')
            .setDescription(`Prize: ${prize}`)
            .addFields(
              { name: 'Hosted by', value: `<@${message.author.id}>`, inline: true },
              { name: 'Winners', value: `${winnersCount}`, inline: true },
              { name: 'Ends', value: `<t:${Math.floor(endsAt / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: 'Click Enter to join!' })
            .setTimestamp();

          const components = [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('gaw_enter')
                .setLabel('Enter')
                .setEmoji('🎉')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('gaw_leave')
                .setLabel('Leave')
                .setStyle(ButtonStyle.Secondary)
            )
          ];

          const msg = await getChannel.send({ embeds: [embed], components }).catch(() => null);
          if (!msg) return modalInteraction.reply('Failed to create the giveaway message.');

          // Start the giveaway
          //guildId, channelId, messageId, hostId, prize, winnersCount, endsAt
          await createGiveaway({
            guildId: message.guild.id,
            channelId: getChannel.id,
            messageId: msg.id,
            hostId: message.author.id,
            prize,
            winnersCount,
            endsAt,
          });

          await modalInteraction.reply('Giveaway started successfully!');
        })
      } else if (interaction.customId === "end") {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: 'You need Manage Server to end giveaways.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId('gaw_end_modal')
          .setTitle('End Giveaway');

        const messageField = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Giveaway message link or ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(messageField));
        await interaction.showModal(modal);

        try {
          const submitted = await interaction.awaitModalSubmit({
            filter: i => i.customId === 'gaw_end_modal' && i.user.id === interaction.user.id,
            time: 60_000
          });

          const raw = submitted.fields.getTextInputValue('message')?.trim();
          const id = parseMessageId(raw);
          if (!id) return submitted.reply({ content: 'Provide a valid message ID or link.', ephemeral: true });

          const g = await getGiveawayByMessageId(id);
          if (!g) return submitted.reply({ content: 'Giveaway not found.', ephemeral: true });

          const { giveaway, winners, roll } = await finishGiveaway(g.id);
          await announceWinners(bot, giveaway, winners, roll);

          return submitted.reply({ content: `Giveaway ended. Winners: ${winnersText(winners)}`, ephemeral: true });
        } catch {
          // timed out or failed
        }
      } else if (interaction.customId === "reroll") {
        if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.reply({ content: 'You need Manage Server to reroll giveaways.', ephemeral: true });
        }

        const modal = new ModalBuilder()
          .setCustomId('gaw_reroll_modal')
          .setTitle('Reroll Giveaway');

        const messageField = new TextInputBuilder()
          .setCustomId('message')
          .setLabel('Giveaway message link or ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(messageField));
        await interaction.showModal(modal);

        try {
          const submitted = await interaction.awaitModalSubmit({
            filter: i => i.customId === 'gaw_reroll_modal' && i.user.id === interaction.user.id,
            time: 60_000
          });

          const raw = submitted.fields.getTextInputValue('message')?.trim();
          const id = parseMessageId(raw);
          if (!id) return submitted.reply({ content: 'Provide a valid message ID or link.', ephemeral: true });

          const g = await getGiveawayByMessageId(id);
          if (!g) return submitted.reply({ content: 'Giveaway not found.', ephemeral: true });

          const { winners, roll } = await rerollGiveaway(g.id);
          await announceWinners(bot, g, winners, roll);

          return submitted.reply({ content: `Rerolled. New winners: ${winnersText(winners)} (roll ${roll})`, ephemeral: true });
        } catch {
          // timed out or failed
        }
      } else if (interaction.customId === "list") {
        const rows = await listActive(interaction.guild.id, 10);
        if (!rows.length) return interaction.reply({ content: 'No active giveaways.', ephemeral: true });

        const lines = rows.map((g, i) =>
          `#${i + 1} • <#${g.channelId}> • [jump](https://discord.com/channels/${interaction.guild.id}/${g.channelId}/${g.messageId}) • Prize: ${g.prize} • Ends: <t:${g.endsUnix}:R>`
        );

        const embed = new EmbedBuilder()
          .setColor('#00BFFF')
          .setTitle('Active Giveaways')
          .setDescription(lines.join('\n'))
          .setTimestamp();

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
    })
  }
}