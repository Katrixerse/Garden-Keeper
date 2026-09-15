const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'roleinfo',
  aliases: ['ri'],
  description: 'Shows information about a role.',
  usage: 'roleinfo <@role|name|id>',
  cooldownTime: '3',
  group: 'info',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if(!args.length) return message.reply('Provide a role');
    const query = args.join(' ').toLowerCase();
    const idMatch = query.match(/\d{5,}/);
    let role = null;
    if(idMatch) role = message.guild.roles.cache.get(idMatch[0]);
    if(!role) role = message.guild.roles.cache.find(r => r.name.toLowerCase() === query);
    if(!role) return message.reply('Role not found');
    const created = `<t:${Math.floor(role.createdTimestamp/1000)}:f> (<t:${Math.floor(role.createdTimestamp/1000)}:R>)`;
    const embed = new EmbedBuilder()
      .setColor(role.color || '#F49A32')
      .setAuthor({ name: role.name })
      .addFields(
        { name: 'ID', value: role.id, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Members', value: `${role.members.size}`, inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
        { name: 'Position', value: `${role.position}`, inline: true },
        { name: 'Created', value: created, inline: false }
      );
    message.channel.send({ embeds: [embed] });
  }
};
