const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { addSubscription, removeSubscription, listByGuild, setMentionRole, setTemplate, setEnabled, setChannel } = require('../../Handlers/dbHandlers/twitchAlerts.js');
const { getUsers } = require('../../Handlers/Twitch/twitchApi.js');

module.exports = {
  name: 'twitch',
  description: 'Manage Twitch live alerts for this server',
  usage: 'twitch add <username> [#channel]\n twitch remove <username>\n twitch list\n twitch role <username> <@role|none>\n twitch template <username> <text with {username} {title} {url} {mention}>\n twitch enable <username> | twitch disable <username>',
  cooldown: 3,
  run: async (bot, prefix, message, args) => {
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Manage Server required.');
    const sub = (args.shift()||'').toLowerCase();

    async function resolveUsername(username){
      const users = await getUsers([username]);
      const u = users && users[0];
      if(!u) return null;
      return { id: u.id, username: u.username };
    }

    if(sub === 'add'){
      const username = (args.shift()||'').toLowerCase(); if(!username) return message.reply('Provide a Twitch name.');
      const info = await resolveUsername(username); if(!info) return message.reply('Twitch user not found.');
      const chan = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
      await addSubscription(message.guild.id, info.id, info.username, chan.id);
      return message.reply(`Subscribed to twitch.tv/${info.username} in ${chan}.`);
    }
    if(sub === 'remove'){
      const username = (args.shift()||'').toLowerCase(); if(!username) return message.reply('Provide a Twitch name.');
      const info = await resolveUsername(username); if(!info) return message.reply('Twitch user not found.');
      await removeSubscription(message.guild.id, info.id);
      return message.reply(`Removed subscription for ${info.username}.`);
    }
    if(sub === 'list'){
      const subs = await listByGuild(message.guild.id);
      if(!subs.length) return message.reply('No Twitch alerts configured.');
      const lines = subs.map(s=>`• ${s.enabled?'[on]':'[off]'} ${s.username||s.twitchUserId} -> <#${s.discordChannelId}> ${s.mentionRoleId?`role:<@&${s.mentionRoleId}>`:''}`);
      const embed = new EmbedBuilder().setTitle('Twitch Alerts').setDescription(lines.join('\n')).setColor(0x9146FF);
      return message.reply({ embeds:[embed] });
    }
    if(sub === 'role'){
      const username = (args.shift()||'').toLowerCase(); if(!username) return message.reply('Provide a Twitch name.');
      const info = await resolveUsername(username); if(!info) return message.reply('Twitch user not found.');
      const roleArg = args.shift(); if(!roleArg) return message.reply('Provide a role mention/ID or "none".');
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(roleArg);
      await setMentionRole(message.guild.id, info.id, role? role.id : null);
      return message.reply(role? `Mention role set to ${role}.` : 'Mention role cleared.');
    }
    if(sub === 'template'){
      const username = (args.shift()||'').toLowerCase(); if(!username) return message.reply('Provide a Twitch name.');
      const info = await resolveUsername(username); if(!info) return message.reply('Twitch user not found.');
      const text = args.join(' ').trim(); if(!text) return message.reply('Provide a message template.');
      await setTemplate(message.guild.id, info.id, text);
      return message.reply('Template updated. Use placeholders: {username} {title} {url} {mention}');
    }
    if(sub === 'enable' || sub === 'disable'){
      const username = (args.shift()||'').toLowerCase(); if(!username) return message.reply('Provide a Twitch name.');
      const info = await resolveUsername(username); if(!info) return message.reply('Twitch user not found.');
      await setEnabled(message.guild.id, info.id, sub === 'enable');
      return message.reply(`Subscription ${sub === 'enable' ? 'enabled' : 'disabled'}.`);
    }

    return message.reply('Usage: '+this.usage);
  }
};
