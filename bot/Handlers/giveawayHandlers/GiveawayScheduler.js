const { EmbedBuilder } = require('discord.js');
const ms = require('ms');
const { ensureGiveawayTables, getActiveToEnd, finishGiveaway } = require('../giveawayHandlers/giveawayManager.js');

function winnersText(ids) {
    if (!ids.length) return 'No valid entries.';
    return ids.map(id => `<@${id}>`).join(', ');
}

async function announceWinners(client, giveaway, winners, roll) {
    try {
        const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setColor('#32CD32')
            .setTitle('🎉 Giveaway Ended')
            .setDescription(`Prize: ${giveaway.prize}`)
            .addFields(
                { name: 'Hosted by', value: `<@${giveaway.hostId}>`, inline: true },
                { name: 'Winners', value: winnersText(winners), inline: false },
                { name: 'Roll', value: `${roll}`, inline: true }
            )
            .setFooter({ text: `Message ID: ${giveaway.messageId}` })
            .setTimestamp(new Date());

        await channel.send({ content: winners.length ? winners.map(id => `<@${id}>`).join(' ') : null, embeds: [embed] });
    } catch (err) {
        console.error('announceWinners error:', err);
    }
}

function setupGiveawayScheduler(client) {
    client.once('clientReady', async () => {
        await ensureGiveawayTables();

        setInterval(async () => {
            try {
                const due = await getActiveToEnd(10);
                for (const g of due) {
                    const { giveaway, winners, roll } = await finishGiveaway(g.id);
                    await announceWinners(client, giveaway, winners, roll);
                }
            } catch (err) {
                console.error('Giveaway scheduler loop error:', err);
            }
        }, ms('15s'));
    });
}

module.exports = { setupGiveawayScheduler, announceWinners };