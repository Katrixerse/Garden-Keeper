const { EmbedBuilder } = require('discord.js');
const { getRep } = require('../../Handlers/gagHandlers/gardenRep.js');

module.exports = {
    name: 'reps',
    aliases: ['repcheck', 'myrep'],
    description: 'Check a user’s Grow a Garden reputation.',
    usage: 'g!reps [@user]',
    cooldownTime: '2',
    group: 'grow',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {
        if (!message.guild) return;

        const target =
            message.mentions.users.first() ||
            (args[0] && await bot.users.fetch(args[0]).catch(() => null)) ||
            message.author;

        try {
            const total = await getRep(message.guild.id, target.id);
            const embed = new EmbedBuilder()
                .setColor('#00BFFF')
                .setAuthor({ name: `Grow a Garden • Reputation`, iconURL: bot.user.displayAvatarURL() })
                .setDescription(`<@${target.id}> has ${total} reputation.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('reps error:', err);
            message.reply('Failed to fetch reputation. Please try again later.');
        }
    }
};