const { EmbedBuilder } = require('discord.js');
module.exports = {
  name: 'userinfo',
  aliases: ['ui','whois'],
  description: 'Shows information about a user.',
  usage: 'userinfo [@user|id]',
  cooldownTime: '3',
  group: 'info',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    const id = (args[0] && args[0].match(/\d{5,}/)) ? args[0].match(/\d{5,}/)[0] : message.author.id;
    const user = await bot.users.fetch(id).catch(()=>null);
    if(!user) return message.reply('User not found');
    const member = message.guild.members.cache.get(user.id) || await message.guild.members.fetch(user.id).catch(()=>null);
    const created = `<t:${Math.floor(user.createdTimestamp/1000)}:f> (<t:${Math.floor(user.createdTimestamp/1000)}:R>)`;
    const joined = member ? `<t:${Math.floor(member.joinedTimestamp/1000)}:f> (<t:${Math.floor(member.joinedTimestamp/1000)}:R>)` : 'N/A';
    const roles = member ? member.roles.cache.filter(r=>r.id!==message.guild.id).sort((a,b)=>b.position-a.position).map(r=>r.toString()).slice(0,20).join(' ') || 'None' : 'None';
    const embed = new EmbedBuilder()
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .setColor('#F49A32')
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: 'ID', value: user.id, inline: true },
        { name: 'Bot', value: user.bot ? 'Yes' : 'No', inline: true },
        { name: 'Created', value: created, inline: false },
        { name: 'Joined', value: joined, inline: false },
        { name: `Roles (${roles.split(' ').length || 0})`, value: roles, inline: false }
      );
    message.channel.send({ embeds: [embed] });
  }
};
