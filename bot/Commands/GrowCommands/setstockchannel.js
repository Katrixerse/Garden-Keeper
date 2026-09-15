const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setstockchannel',
    description: 'Set or view custom stock-related channel destinations',
    usage: '!setstockchannel <type> <#channel>|clear',
    aliases: ['ssc','stockchan'],
    cooldownTime: 3,
    // match messageCreate invocation: run(bot, prefix, message, args)
    async run(bot, prefix, message, args) {
        const safeReply = async (content) => {
            try {
                if (typeof message.reply === 'function') return await message.reply(content);
                return await message.channel.send(content);
            } catch { /* ignore send errors */ }
        };
        const { upsertGuildStockChannel, getGuildStockChannels } = require('../../Handlers/dbHandlers/stockChannels');

        // Ensure guild context
    if(!message.guild) return safeReply('This command can only be used in a server.');

        // Safely obtain member (may be undefined for some events / partials)
        let member = message.member;
        if(!member) {
            try { member = await message.guild.members.fetch(message.author.id); } catch(_) {}
        }

        const canManage = member?.permissions?.has(PermissionsBitField.Flags.ManageGuild) || member?.permissions?.has(PermissionsBitField.Flags.Administrator);
    if(!canManage) return safeReply('You need the Manage Server permission.');

        const valid = {
            stock: 'stockChannelId',
            eggs: 'eggChannelId',
            event: 'eventChannelId',
            merchant: 'merchantChannelId',
            cosmetics: 'cosmeticsChannelId',
            weather: 'weatherChannelId'
        };

        if(!args.length) {
            const current = await getGuildStockChannels(message.guild.id) || {};
            const lines = Object.entries(valid).map(([k, dbK]) => `${k}: ${current[dbK] ? '<#'+current[dbK]+'>' : 'default'}`);
            return safeReply('Configured channels:\n'+lines.join('\n'));
        }

        const type = args.shift().toLowerCase();
    if(!valid[type]) return safeReply('Type must be one of: '+Object.keys(valid).join(', '));

        const key = valid[type];
        const action = args[0];
    if(!action) return safeReply('Provide a #channel mention or "clear".');

        if(action.toLowerCase() === 'clear') {
            await upsertGuildStockChannel(message.guild.id, key, null);
            return safeReply(`${type} channel override cleared.`);
        }

        const channel = message.mentions.channels.first();
    if(!channel) return safeReply('Mention a channel.');

        await upsertGuildStockChannel(message.guild.id, key, channel.id);
        safeReply(`${type} channel set to ${channel}.`);
    }
};
