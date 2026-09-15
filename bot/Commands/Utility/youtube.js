const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addSubscription, removeSubscription, listByGuild, setMentionRole, setTemplate, setEnabled } = require('../../Handlers/dbHandlers/youtubeAlerts.js');

module.exports = {
  name: 'youtube',
  description: 'Manage YouTube upload alerts for this server',
  usage: 'youtube add <channelId> [#channel]\n youtube remove <channelId>\n youtube list\n youtube role <channelId> <@role|none>\n youtube template <channelId> <text with {title} {url} {mention}>\n youtube enable <channelId> | youtube disable <channelId>',
  cooldown: 3,
  run: async (bot, prefix, message, args) => {
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Manage Server required.');
    const sub = (args.shift()||'').toLowerCase();

    if(sub === 'add'){
      const ytId = args.shift(); if(!ytId) return message.reply('Provide a YouTube channel ID.');
      const chan = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
      await addSubscription(message.guild.id, ytId, chan.id);
      return message.reply(`Subscribed to channel ${ytId} in ${chan}.`);
    }
    if(sub === 'remove'){
      const ytId = args.shift(); if(!ytId) return message.reply('Provide a YouTube channel ID.');
      await removeSubscription(message.guild.id, ytId);
      return message.reply(`Removed subscription for ${ytId}.`);
    }
    if(sub === 'list'){
      const subs = await listByGuild(message.guild.id);
      if(!subs.length) return message.reply('No YouTube alerts configured.');
      const lines = subs.map(s=>`• ${s.enabled?'[on]':'[off]'} ${s.ytChannelId} -> <#${s.discordChannelId}> ${s.mentionRoleId?`role:<@&${s.mentionRoleId}>`:''}`);
      const embed = new EmbedBuilder().setTitle('YouTube Alerts').setDescription(lines.join('\n')).setColor(0xff0000);
      return message.reply({ embeds:[embed] });
    }
    if(sub === 'role'){
      const ytId = args.shift(); if(!ytId) return message.reply('Provide a YouTube channel ID.');
      const roleArg = args.shift(); if(!roleArg) return message.reply('Provide a role mention/ID or "none".');
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(roleArg);
      await setMentionRole(message.guild.id, ytId, role? role.id : null);
      return message.reply(role? `Mention role set to ${role}.` : 'Mention role cleared.');
    }
    if(sub === 'template'){
      const ytId = args.shift(); if(!ytId) return message.reply('Provide a YouTube channel ID.');
      const text = args.join(' ').trim(); if(!text) return message.reply('Provide a message template.');
      await setTemplate(message.guild.id, ytId, text);
      return message.reply('Template updated. Use placeholders: {title} {url} {mention}');
    }
    if(sub === 'enable' || sub === 'disable'){
      const ytId = args.shift(); if(!ytId) return message.reply('Provide a YouTube channel ID.');
      await setEnabled(message.guild.id, ytId, sub === 'enable');
      return message.reply(`Subscription ${sub === 'enable' ? 'enabled' : 'disabled'}.`);
    }

    return message.reply('Usage: '+this.usage);
  }
};
