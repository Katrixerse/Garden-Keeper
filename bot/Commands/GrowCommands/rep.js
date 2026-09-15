const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
const { COOLDOWN_MS, canGiveRep, giveRep, } = require('../../Handlers/gagHandlers/gardenRep.js');

module.exports = {
    name: 'rep',
    aliases: ['giverep', 'gr'],
    description: 'Give reputation to a user for Grow a Garden.',
    usage: 'g!rep @user [reason]',
    cooldownTime: '3',
    group: 'grow',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {
        if (!message.guild) return;

        const target =
            message.mentions.users.first() ||
            (args[0] && await bot.users.fetch(args[0]).catch(() => null));

        if (!target) return message.reply(`Usage: ${prefix}rep @user [reason]`);
        if (target.id === message.author.id) return message.reply("You can't rep yourself.");
        if (target.bot) return message.reply("You can't rep a bot.");

        const reason = args.slice(message.mentions.users.size ? 1 : 1).join(' ').trim() || null;

        const { ok, remainingMs } = await canGiveRep(message.guild.id, message.author.id);
        if (!ok) {
            return message.reply(`You can give rep again in ${ms(remainingMs, { long: true })}.`);
        }

        try {
            const total = await giveRep(message.guild.id, target.id, message.author.id, reason);
            const embed = new EmbedBuilder()
                .setColor('#32CD32')
                .setAuthor({ name: `Grow a Garden • Reputation`, iconURL: bot.user.displayAvatarURL() })
                .setDescription(`<@${message.author.id}> gave rep to <@${target.id}>${reason ? ` for: ${reason}` : ''}.`)
                .addFields([{ name: 'New total', value: `${total}`, inline: true }])
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('rep error:', err);
            message.reply('Failed to give rep. Please try again later.');
        }
    }
};