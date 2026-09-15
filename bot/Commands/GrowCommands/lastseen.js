const { EmbedBuilder } = require('discord.js');
const { conn } = require('../../Handlers/dbHandlers/dbConnection');

/*
 * g!lastseen            -> lists all tracked stock items with last seen times
 * g!lastseen <item...>  -> shows last seen time for a specific (partial match allowed) item
 */
module.exports = {
    name: 'lastseen',
    aliases: ['lsstock', 'lastseenstock'],
    description: 'Show Grow a Garden stock items last seen in store.',
    usage: 'g!lastseen [item name]',
    cooldownTime: '2',
    group: 'grow',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {
        if (!message.guild) return;

        const now = Math.floor(Date.now() / 1000);
        const freshnessCutoffBase = now - 1200; // mirrors logic used in fetchLastSeen

        try {
            let rows;
            if (args.length) {
                const search = args.join(' ').toLowerCase();
                [rows] = await conn.promise().query(
                    'SELECT stock_name, last_seen FROM last_seen_stock WHERE LOWER(stock_name) LIKE ? ORDER BY last_seen DESC LIMIT 25',
                    [`%${search}%`]
                );
                if (!rows.length) {
                    return message.reply(`No tracked stock item matches "${search}".`);
                }
            } else {
                [rows] = await conn.promise().query(
                    'SELECT stock_name, last_seen FROM last_seen_stock ORDER BY last_seen DESC LIMIT 50'
                );
                if (!rows.length) {
                    return message.reply('No stock activity has been tracked yet.');
                }
            }

            const lines = rows.map(r => {
                const displayTime = r.last_seen + 300; // replicate offset used when storing in state
                const isNow = freshnessCutoffBase <= displayTime; // mirrors condition for "Now"
                return `${r.stock_name} — ${isNow ? 'Now' : `<t:${displayTime}:f>`}`;
            });

            // Split into multiple embeds if too large (Discord limit ~6000 chars) – simple single embed is likely fine
            let description = lines.join('\n');
            if (description.length > 3900) { // keep headroom for embed meta
                description = description.slice(0, 3900) + '\n... (truncated)';
            }

            const title = args.length ? 'Last Seen • Search Results' : 'Last Seen • All Tracked Items';

            const embed = new EmbedBuilder()
                .setColor('#F49A32')
                .setAuthor({ name: 'Grow a Garden • Last Seen', iconURL: bot.user.displayAvatarURL() })
                .setTitle(title)
                .setDescription(description)
                .setFooter({ text: 'Times are approximations (+5m offset).' })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('lastseen command error:', err);
            message.reply('Failed to fetch last seen data. Please try again later.');
        }
    }
};
