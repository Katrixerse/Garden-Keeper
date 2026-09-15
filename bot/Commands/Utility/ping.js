const { EmbedBuilder } = require("discord.js");
const ms = require("ms");

module.exports = {
    name: 'ping',
    aliases: ["pong"],
    description: 'Pings the bot',
    usage: 'ping',
    cooldownTime: '1',
    group: 'info',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {

        const start = Date.now();

        const pingEmbed = new EmbedBuilder()
            .setDescription("Getting ping...")
            .setColor(`#F49A32`);

        message.channel.send({ embeds: [pingEmbed] }).then(m => {

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Ping!`, iconURL: bot.user.avatarURL() })
                .addFields([
                    { name: "API:", value: `${Math.round(bot.ws.ping + 2)}ms`, inline: true },
                    { name: "Bot:", value: `${Date.now() - start}ms`, inline: true },
                    { name: "Uptime:", value: `${ms(bot.uptime, { long: true })}`, inline: true }
                ])
                .setColor(`#F49A32`);
            if (m.editable) m.edit({ embeds: [embed] });
        });
    }
};