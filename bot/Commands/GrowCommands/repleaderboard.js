const { EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../../Handlers/gagHandlers/gardenRep.js');

module.exports = {
    name: 'replb',
    aliases: ['repleaderboard', 'greplb'],
    description: 'Show the Grow a Garden reputation leaderboard.',
    usage: 'g!replb',
    cooldownTime: '5',
    group: 'grow',
    botPermissions: ['none'],
    run: async (bot, prefix, message) => {
        if (!message.guild) return;

        try {
            const rows = await getLeaderboard(message.guild.id, 10);
            if (!rows.length) return message.reply('No reputation data yet.');

            const lines = rows.map((r, i) => `#${i + 1} — <@${r.userId}>: ${r.reputation}`);
            const embed = new EmbedBuilder()
                .setColor('#F49A32')
                .setAuthor({ name: `Grow a Garden • Leaderboard`, iconURL: bot.user.displayAvatarURL() })
                .setDescription(lines.join('\n'))
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('replb error:', err);
            message.reply('Failed to fetch leaderboard. Please try again later.');
        }
    }
};