const { PermissionsBitField } = require('discord.js');
const { getWelcomeSettings, setWelcomeSettings } = require('../../Handlers/dbHandlers/welcomeSettings.js');

module.exports = {
  name: 'welcome',
  aliases: ['welcomeset','welcomemsg'],
  description: 'Configure or toggle the server welcome message with canvas card.',
  usage: 'welcome <enable|disable|channel|message|background|show> [...]',
  cooldownTime: 2,
  run: async (bot, prefix, message, args) => {
    if(!message.guild) return;
    const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
    const invoker = message.member;
    if(!invoker.permissions.has(PermissionsBitField.Flags.ManageGuild)) return message.reply('Need Manage Server permission.');
    if(!me.permissions.has(PermissionsBitField.Flags.SendMessages)) return message.reply('I lack SendMessages permission.');

    const sub = (args[0]||'').toLowerCase();
    const settings = await getWelcomeSettings(message.guild.id);

    async function save(patch){
      const next = { ...settings, ...patch };
      await setWelcomeSettings(message.guild.id, next);
      return next;
    }

    if(!sub || sub === 'show'){
      return message.reply(`Welcome settings:\nEnabled: ${settings.enabled? 'Yes':'No'}\nChannel: ${settings.channelId?'<#'+settings.channelId+'>':'(not set)'}\nBackground: ${settings.backgroundUrl||'(default gradient)'}\nTemplate: ${settings.messageTemplate || 'Welcome to the server, {mention}!'}\nPlaceholders: {mention} {username} {tag} {id} {memberCount}`);
    }

    if(sub === 'enable' || sub === 'on'){
      if(!settings.channelId) return message.reply('Set a channel first: '+(prefix||'!')+'welcome channel #channel');
      await save({ enabled:1 });
      return message.reply('Welcome system enabled.');
    }
    if(sub === 'disable' || sub === 'off'){
      await save({ enabled:0 });
      return message.reply('Welcome system disabled.');
    }

    if(sub === 'channel'){
      const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
      if(!ch || !ch.isTextBased()) return message.reply('Provide a text channel mention or ID.');
      await save({ channelId: ch.id });
      return message.reply('Welcome channel set to '+ch.toString());
    }

    if(sub === 'message' || sub === 'template'){
      const tpl = args.slice(1).join(' ').trim();
      if(!tpl) return message.reply('Provide a message template.');
      if(tpl.length > 500) return message.reply('Template too long (max 500 chars).');
      await save({ messageTemplate: tpl });
      return message.reply('Welcome message template updated.');
    }

    if(sub === 'background' || sub === 'bg'){
      const url = args[1];
      if(!url) return message.reply('Provide an image URL or "clear".');
      if(url.toLowerCase() === 'clear'){
        await save({ backgroundUrl: null });
        return message.reply('Background cleared (using gradient).');
      }
      if(!/^https?:\/\//i.test(url)) return message.reply('Background must be a valid http/https URL.');
      await save({ backgroundUrl: url });
      return message.reply('Background image set.');
    }

    return message.reply('Unknown subcommand. Use show|enable|disable|channel|message|background');
  }
};
