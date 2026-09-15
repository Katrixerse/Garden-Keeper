const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { addReactionRole, removeReactionRole, clearReactionRolesForMessage, getReactionRolesForMessage } = require('../Handlers/dbHandlers/reactionRoles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Manage reaction roles on a message')
    .setDMPermission(false)
    .addSubcommand(sc=>sc.setName('add').setDescription('Add a reaction role')
      .addStringOption(o=>o.setName('message_id').setDescription('Target message ID').setRequired(true))
      .addStringOption(o=>o.setName('emoji').setDescription('Emoji').setRequired(true))
      .addRoleOption(o=>o.setName('role').setDescription('Role to assign').setRequired(true))
      .addChannelOption(o=>o.setName('channel').setDescription('Channel containing the message').setRequired(false)))
    .addSubcommand(sc=>sc.setName('remove').setDescription('Remove a reaction role mapping')
      .addStringOption(o=>o.setName('message_id').setDescription('Target message ID').setRequired(true))
      .addStringOption(o=>o.setName('emoji').setDescription('Emoji').setRequired(true))
      .addChannelOption(o=>o.setName('channel').setDescription('Channel containing the message').setRequired(false)))
    .addSubcommand(sc=>sc.setName('list').setDescription('List reaction roles on a message')
      .addStringOption(o=>o.setName('message_id').setDescription('Target message ID').setRequired(true))
      .addChannelOption(o=>o.setName('channel').setDescription('Channel containing the message').setRequired(false)))
    .addSubcommand(sc=>sc.setName('clear').setDescription('Clear all reaction roles on a message')
      .addStringOption(o=>o.setName('message_id').setDescription('Target message ID').setRequired(true))
      .addChannelOption(o=>o.setName('channel').setDescription('Channel containing the message').setRequired(false))),

  cooldownMs: 3000,

  async execute(interaction){
    if(!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles)) return interaction.reply({ content: 'Need Manage Roles permission.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
  const messageId = interaction.options.getString('message_id');
  const chosenChannel = interaction.options.getChannel('channel');
  const channel = chosenChannel && chosenChannel.isTextBased() ? chosenChannel : interaction.channel;
  let targetMsg;
  try { targetMsg = await channel.messages.fetch(messageId); } catch { return interaction.reply({ content: 'Cannot find that message in the specified channel.', ephemeral: true }); }

    if(sub === 'list') {
      const rows = await getReactionRolesForMessage(interaction.guild.id, messageId);
      if(!rows.length) return interaction.reply({ content: 'No reaction roles on that message.', ephemeral: true });
      const lines = rows.map(r => `${r.emoji} -> <@&${r.roleId}>`);
      return interaction.reply({ content: lines.join('\n'), ephemeral: true });
    }
    if(sub === 'clear') {
      await clearReactionRolesForMessage(interaction.guild.id, messageId);
      return interaction.reply({ content: 'Cleared reaction roles on that message.', ephemeral: true });
    }
    if(sub === 'remove') {
      const emoji = interaction.options.getString('emoji');
      await removeReactionRole(interaction.guild.id, messageId, emoji);
      return interaction.reply({ content: 'Reaction role removed (if existed).', ephemeral: true });
    }
    if(sub === 'add') {
      const emoji = interaction.options.getString('emoji');
      const role = interaction.options.getRole('role');
      try { await targetMsg.react(emoji); } catch { return interaction.reply({ content: 'Failed to react (invalid emoji or perms).', ephemeral: true }); }
  await addReactionRole(interaction.guild.id, messageId, channel.id, emoji, role.id);
      return interaction.reply({ content: 'Reaction role added.', ephemeral: true });
    }
    return interaction.reply({ content: 'Unhandled subcommand.', ephemeral: true });
  }
};
