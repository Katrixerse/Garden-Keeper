const { EmbedBuilder, version } = require("discord.js");
const { botVersion } = require("../../../config.json");
const os = require("os");
const ms = require("ms");

module.exports = {
    name: 'botinfo',
    aliases: ["botinfo"],
    description: 'Shows information about the bot',
    usage: 'ping',
    cooldownTime: '1',
    group: 'info',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {
        const botInfoEmbed = new EmbedBuilder()
            .setAuthor({ name: `Bot Information!`, iconURL: bot.user.avatarURL() })
            .addFields([
                { name: '**__Info:__**', value: `**Bot Name:** ${bot.user.username}\n**Bot ID:** ${bot.user.id}\n**Commands:** ${bot.commands.size}\n**Uptime:** ${ms(bot.uptime, { long: true })}\n**Bot Version:** ${botVersion}\n**Discord.js Version:** ${version}\n**Node.js Version:** ${process.version}` },
                { name: '**__System:__**', value: `**OS:** ${os.platform()}\n**CPU:** Intel(R) Xeon(R) Gold 6140\n**CPU Cores:** ${os.cpus().length}\n**Memory:** ${Math.round(os.totalmem() / 1024 / 1024)}MB\n**Uptime:** ${ms(os.uptime() * 1000, { long: true })}` },
            ])
            .setColor(`#F49A32`);
        message.channel.send({ embeds: [botInfoEmbed] })
    }
};