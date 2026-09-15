const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getCaptchaSettings, setCaptchaSettings } = require('../../Handlers/dbHandlers/captchaSettings.js');

module.exports = {
  name: 'captcha',
  description: 'Configure join captcha verification system',
  usage: 'captcha enable|disable|role <@role>|status',
  cooldown: 3,
  run: async (bot, prefix, message, args) => {
    if(!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('You need Manage Server permission.');
    const sub = (args.shift()||'').toLowerCase();
    const settings = await getCaptchaSettings(message.guild.id);

    if(sub === 'enable'){
      if(!settings.roleId) return message.reply('Set a verified role first: captcha role @Role');
      await setCaptchaSettings(message.guild.id, { enabled:1, roleId: settings.roleId });
      return message.reply('Join captcha enabled.');
    }
    if(sub === 'disable'){
      await setCaptchaSettings(message.guild.id, { enabled:0, roleId: settings.roleId });
      return message.reply('Join captcha disabled.');
    }
    if(sub === 'role'){
      const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
      if(!role) return message.reply('Provide a role mention or ID.');
      await setCaptchaSettings(message.guild.id, { enabled: settings.enabled, roleId: role.id });
      return message.reply(`Verified role set to ${role}`);
    }
    const roleDisp = settings.roleId ? (message.guild.roles.cache.get(settings.roleId) || settings.roleId) : 'Not set';
    const embed = new EmbedBuilder()
      .setTitle('Captcha Settings')
      .addFields(
        { name: 'Enabled', value: settings.enabled? 'Yes':'No', inline: true },
        { name: 'Role', value: String(roleDisp), inline: true }
      )
      .setColor(settings.enabled?0x2e7d32:0x555555);
    return message.reply({ embeds:[embed] });
  }
};
