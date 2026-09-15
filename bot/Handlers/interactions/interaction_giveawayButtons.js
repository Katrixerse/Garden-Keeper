const { addEntry, removeEntry, getGiveawayByMessageId, hasEntered, getEntries } = require('../giveawayHandlers/giveawayManager.js');
const { MessageFlags } = require('discord.js');

module.exports = async (bot, interaction) => {
  try {
    if (!interaction.isButton()) return;
    if (!interaction.inGuild()) return;

    const { customId, user, message, guildId } = interaction;
    if (!message?.id) return;

    if (customId !== 'gaw_enter' && customId !== 'gaw_leave') return;

    const giveaway = await getGiveawayByMessageId(message.id);
    if (!giveaway || giveaway.guildId !== guildId) return;

    if (giveaway.ended) {
      return interaction.reply({ content: 'This giveaway has already ended.', flags: MessageFlags.Ephemeral });
    }
    if (user.bot) return;

    if (customId === 'gaw_enter') {
      const already = await hasEntered(giveaway.id, user.id);
      if (already) {
        return interaction.reply({ content: 'You are already entered.', flags: MessageFlags.Ephemeral });
      }
      await addEntry(giveaway.id, user.id).catch(() => {});
      const total = (await getEntries(giveaway.id)).length;
      return interaction.reply({ content: `You entered the giveaway! Total entries: ${total}`, flags: MessageFlags.Ephemeral });
    }

    if (customId === 'gaw_leave') {
      const already = await hasEntered(giveaway.id, user.id);
      if (!already) {
        return interaction.reply({ content: 'You are not entered.', flags: MessageFlags.Ephemeral });
      }
      await removeEntry(giveaway.id, user.id).catch(() => {});
      const total = (await getEntries(giveaway.id)).length;
      return interaction.reply({ content: `You left the giveaway. Total entries: ${total}`, flags: MessageFlags.Ephemeral });
    }
  } catch (err) {
    console.error('giveaway button interaction error:', err);
    if (interaction.isRepliable()) {
      try { await interaction.reply({ content: 'Something went wrong.', flags: MessageFlags.Ephemeral }); } catch {}
    }
  }
};