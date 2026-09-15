const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { getAuditSettings, setAuditSettings, fetchRecent } = require('../../Handlers/modHandlers/auditLog.js');

module.exports = {
  name: 'auditlog',
  aliases: ['modlog','modlogs'],
  description: 'Configure or view moderation audit log settings / recent entries.',
  usage: 'auditlog <enable|disable|channel|show|recent> [value]',
  cooldownTime: 2,
  run: async (bot, prefix, message, args) => {
    if(!message.guild) return;
    const member = message.member;
    if(!member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply('Need Manage Server permission.');

    const sub = (args[0]||'').toLowerCase();
    const settings = await getAuditSettings(message.guild.id);

    if(!sub || sub === 'show'){
      return message.reply(`Audit Log Settings:\nEnabled: ${settings.enabled?'Yes':'No'}\nChannel: ${settings.channelId?'<#'+settings.channelId+'>':'(not set)'}\nUse ${prefix}auditlog channel #channel | enable | disable | recent`);
    }

    if(sub === 'channel'){
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if(!ch || !ch.isTextBased()) return message.reply('Provide a text channel mention or ID.');
      await setAuditSettings(message.guild.id, { ...settings, channelId: ch.id });
      return message.reply('Audit log channel set to '+ch.toString());
    }

    if(sub === 'enable' || sub === 'on'){
      if(!settings.channelId) return message.reply('Set a channel first.');
      await setAuditSettings(message.guild.id, { ...settings, enabled:1 });
      return message.reply('Audit logging enabled.');
    }

    if(sub === 'disable' || sub === 'off'){
      await setAuditSettings(message.guild.id, { ...settings, enabled:0 });
      return message.reply('Audit logging disabled.');
    }

    if(sub === 'recent'){
      const limit = Math.min(50, Math.max(1, parseInt(args[1])||10));
      const rows = await fetchRecent(message.guild.id, limit);
      if(!rows.length) return message.reply('No recent audit entries.');
  const lines = rows.map(r=>`#${r.id} • ${r.action} | <@${r.targetId||'n/a'}> by <@${r.moderatorId||'n/a'}> ${r.reason?'- '+r.reason:''}`).slice(0,15);
      const embed = new EmbedBuilder().setTitle('Recent Mod Actions').setDescription(lines.join('\n').slice(0,4000)).setColor(0x5865F2).setTimestamp();
      return message.channel.send({ embeds:[embed] });
    }

    return message.reply('Unknown subcommand. Use show|channel|enable|disable|recent');
  }
};
