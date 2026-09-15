const { EmbedBuilder } = require('discord.js');
const { startVerification, checkVerification } = require('../../Handlers/gagHandlers/robloxLink.js');

module.exports = {
    name: 'rbxverify',
    aliases: ['verifyroblox', 'robloxverify'],
    description: 'Verify and link your Roblox account to your Discord.',
    usage: 'g!rbxverify <roblox username>\n g!rbxverify check',
    cooldownTime: '3',
    group: 'roblox',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {
        if (!message.guild) return;
        const sub = (args[0] || '').toLowerCase();

        if (!sub) {
            return message.reply(`Usage:\n${prefix}rbxverify <roblox username>\n${prefix}rbxverify check`);
        }

        if (sub === 'check') {
            try {
                const linked = await checkVerification(message.author.id);
                const embed = new EmbedBuilder()
                    .setColor('#32CD32')
                    .setAuthor({ name: 'Roblox Verification', iconURL: bot.user.displayAvatarURL() })
                    .setDescription(`Successfully linked to Roblox account: ${linked.robloxUsername} (${linked.robloxUserId}).`);
                return message.channel.send({ embeds: [embed] });
            } catch (err) {
                return message.reply(err.message || 'Verification failed. Try again.');
            }
        }

        // Start flow with username
        const username = args[0];
        try {
            const { username: normalized, code, expiresAt } = await startVerification(message.author.id, username);
            const embed = new EmbedBuilder()
                .setColor('#F49A32')
                .setAuthor({ name: 'Roblox Verification', iconURL: bot.user.displayAvatarURL() })
                .setDescription([
                    `1) Go to your Roblox profile and edit your Description.`,
                    `2) Add this code exactly:`,
                    '```',
                    code,
                    '```',
                    `3) Save, wait a few seconds, then run:`,
                    `\`${prefix}rbxverify check\``,
                ].join('\n'))
                .addFields([{ name: 'Username', value: normalized, inline: true }, { name: 'Expires', value: `<t:${Math.floor(new Date(expiresAt).getTime()/1000)}:R>`, inline: true }]);
            message.channel.send({ embeds: [embed] });

            const result = await checkVerification(message.author.id, message.guild);
            if (result.roleGrant?.ok) {
                embed.setColor('#32CD32')
                    .setDescription(`Successfully linked to Roblox account: ${result.robloxUsername} (${result.robloxUserId}).`);
            } else {
                embed.setColor('#F49A32')
                    .setDescription(`Verification complete, but failed to grant role: ${result.roleGrant?.reason || 'unknown'}.`);
            }
            return message.channel.send({ embeds: [embed] });
        } catch (err) {
            return message.reply(err.message || 'Could not start verification.');
        }
    }
};