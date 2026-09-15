const { PermissionsBitField } = require('discord.js');
const { getLevelRoles, setLevelRole, removeLevelRole } = require('../../Handlers/leveling/levelRoles');

module.exports = {
  name: 'levelroles',
  aliases: ['lvlroles','lr'],
  description: 'Configure roles granted at specific leveling milestones.',
  usage: 'levelroles add <level> <@role|roleId> [stack|replace]\nlevelroles remove <level> <@role|roleId>\nlevelroles list',
  cooldownTime: 2,
  run: async (bot, prefix, message, args) => {
    if(!message.guild) return;
    const invoker = message.member;
    if(!invoker.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply('Need Manage Server permission.');

    const sub = (args[0]||'').toLowerCase();
    if(!sub || sub === 'list'){
      const rows = await getLevelRoles(message.guild.id);
      if(!rows.length) return message.reply('No level roles configured. Use add to create one.');
      const lines = rows.map(r=>`Level ${r.level}: <@&${r.roleId}> (${r.grantMode})`).slice(0,30);
      return message.reply('Level Roles:\n'+lines.join('\n'));
    }

    if(sub === 'add'){
      const level = parseInt(args[1]);
      const roleMention = args[2];
      const mode = (args[3]||'stack').toLowerCase();
      if(!level || !roleMention) return message.reply(`Usage: ${prefix}levelroles add <level> <@role|roleId> [stack|replace]`);
      const roleId = roleMention.match(/\d{5,20}/)?.[0];
      if(!roleId) return message.reply('Invalid role mention/ID.');
      const ok = await setLevelRole(message.guild.id, level, roleId, mode === 'replace' ? 'replace':'stack');
      return message.reply(ok ? `Set level ${level} -> <@&${roleId}> (${mode === 'replace'?'replace':'stack'})` : 'Failed to set role.');
    }

    if(sub === 'remove' || sub === 'del' || sub === 'delete'){
      const level = parseInt(args[1]);
      const roleMention = args[2];
      if(!level || !roleMention) return message.reply(`Usage: ${prefix}levelroles remove <level> <@role|roleId>`);
      const roleId = roleMention.match(/\d{5,20}/)?.[0];
      if(!roleId) return message.reply('Invalid role mention/ID.');
      const ok = await removeLevelRole(message.guild.id, level, roleId);
      return message.reply(ok ? 'Removed.' : 'Failed to remove.');
    }

    return message.reply('Unknown subcommand. Use list|add|remove');
  }
};
