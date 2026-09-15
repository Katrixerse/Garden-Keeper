const { PermissionsBitField } = require('discord.js');
const { addReactionRole, removeReactionRole, clearReactionRolesForMessage, getReactionRolesForMessage } = require('../../Handlers/dbHandlers/reactionRoles');

module.exports = {
  name: 'reactionrole',
  description: 'Configure reaction roles (add/remove/list/clear)',
  usage: 'reactionrole <add|remove|list|clear> [#channel|channelId] <messageId> [emoji] [@role]',
  aliases: ['rr','reactrole'],
  cooldownTime: 3,
  async run(bot, prefix, message, args){
    if(!message.guild) return;
    if(!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) return message.reply('Need Manage Roles permission.');
    const sub = (args.shift()||'').toLowerCase();
    if(!['add','remove','list','clear'].includes(sub)) return message.reply('Subcommand must be add, remove, list, or clear.');
    // Optional channel argument
    let targetChannel = message.channel;
    if(args[0]) {
      const chanMention = args[0].match(/^<#(\d+)>$/);
      const possibleId = chanMention ? chanMention[1] : args[0];
      const fetchedChannel = message.guild.channels.cache.get(possibleId);
      if(fetchedChannel && fetchedChannel.isTextBased()) {
        targetChannel = fetchedChannel;
        args.shift();
      }
    }

    const messageId = args.shift();
    if(!messageId) return message.reply('Provide the target message ID.');

    let targetMsg;
    try { targetMsg = await targetChannel.messages.fetch(messageId); } catch { return message.reply('Cannot find that message in the specified channel.'); }

    if(sub === 'list') {
      const rows = await getReactionRolesForMessage(message.guild.id, messageId);
      if(!rows.length) return message.reply('No reaction roles on that message.');
      const lines = rows.map(r => `${r.emoji} -> <@&${r.roleId}>`);
      return message.reply('Reaction roles:\n'+lines.join('\n'));
    }

    if(sub === 'clear') {
  await clearReactionRolesForMessage(message.guild.id, messageId);
  return message.reply('Cleared reaction roles on that message.');
    }

    const emoji = args.shift();
    if(!emoji) return message.reply('Provide an emoji.');

    if(sub === 'remove') {
      await removeReactionRole(message.guild.id, messageId, emoji);
      return message.reply('Reaction role removed (if it existed).');
    }

    // add
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if(!role) return message.reply('Mention a role or provide a role ID.');
  try { await targetMsg.react(emoji); } catch { return message.reply('Failed to add reaction; invalid emoji or missing permissions.'); }
  await addReactionRole(message.guild.id, messageId, targetChannel.id, emoji, role.id);
    return message.reply('Reaction role added.');
  }
};
