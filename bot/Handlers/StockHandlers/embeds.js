const { EmbedBuilder } = require("discord.js");
const { state, weatherState } = require("./state");
const { handleRoles, handleEggRoles, handleWeatherRoles } = require("./roles");
const { generateStockPredictions } = require('./stockPredictions');

// --- Internal helpers -----------------------------------------------------
function baseEmbed(bot, color = "#F49A32") {
    return new EmbedBuilder()
        .setAuthor({ name: "Grow a Garden", iconURL: bot.user.avatarURL() })
        .setColor(color)
        .setTimestamp();
}

async function sendWithMentions(channel, embed, roleIds) {
    if (roleIds && roleIds.length) {
        const content = roleIds.map(id => `<@&${id}>`).join(" ");
        await channel.send({ content, embeds: [embed], allowedMentions: { roles: roleIds, parse: [] } });
    } else {
        await channel.send({ embeds: [embed] });
    }
}

function simpleRolePingEmbed({ bot, guild, channel, fieldName, value, roleName }) {
    const embed = baseEmbed(bot).addFields({ name: fieldName, value, inline: true });
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role) {
        return channel.send({ content: `<@&${role.id}>`, embeds: [embed] });
    }
    return channel.send({ embeds: [embed] });
}

// --- Public embed senders -------------------------------------------------
async function sendStockEmbed(bot, guild, channel) {
    const embed = baseEmbed(bot)
        .addFields(
            { name: "Seed Stock:", value: state.SeedStock, inline: true },
            { name: "Gear Stock:", value: state.GearStock, inline: false }
        );
    await handleRoles(bot, guild);
    return sendWithMentions(channel, embed, state.pingRoles);
}

async function sendEggStockEmbed(bot, guild, channel) {
    const embed = baseEmbed(bot).addFields({ name: "Egg Stock:", value: state.EggStock, inline: true });
    await handleEggRoles(bot, guild);
    return sendWithMentions(channel, embed, state.pingEggRoles);
}

async function sendEventShopEmbed(bot, guild, channel) {
    return simpleRolePingEmbed({ bot, guild, channel, fieldName: "Event Stock:", value: state.storeEventStock, roleName: "Event Stock" });
}

async function sendTravelingMerchantStockEmbed(bot, guild, channel) {
    return simpleRolePingEmbed({ bot, guild, channel, fieldName: "Traveling Merchant Has Arrived", value: state.storeTravelingMerchantStock, roleName: "Traveling Merchant" });
}

async function sendCosmeticStockEmbed(bot, guild, channel) {
    return simpleRolePingEmbed({ bot, guild, channel, fieldName: "Cosmetics Stock:", value: state.storeCosmeticStock, roleName: "Cosmetics Stock" });
}

async function sendForeverPackEmbed(bot, guild, channel) {
    return simpleRolePingEmbed({ bot, guild, channel, fieldName: "Forever Pack Stock:", value: state.storeForeverPackStock, roleName: "Forever Pack" });
}

async function sendWeatherEmbed(bot, guild, channel) {
    const nowUnix = Math.floor(Date.now() / 1000);
    // Defensive: filter out any null/undefined or malformed entries
    const rawEvents = Array.isArray(weatherState.events) ? weatherState.events : [];
    const events = rawEvents.filter(e => e && typeof e === 'object' && (e.name || e.endsAtUnix));
    if (!events.length) {
        // Nothing valid to display; optionally could delete prior message, but we just return.
        return;
    }
    const multi = events.length > 1;

    const embed = baseEmbed(bot, "#00FF00");

    if (multi) {
        const MAX_FIELDS = 24; // leave buffer
        const slice = events.slice(0, MAX_FIELDS);
        embed.addFields({ name: `Active Weather Events (${events.length})`, value: "Multiple events detected", inline: false });
        for (const ev of slice) {
            if(!ev) continue;
            embed.addFields({
                name: ev.name || "Unknown",
                value: `Ends At: <t:${ev.endsAtUnix}:t> (<t:${ev.endsAtUnix}:R>)`,
                inline: false
            });
        }
        if (events.length > slice.length) {
            embed.addFields({ name: "More Events", value: `${events.length - slice.length} additional event(s) not shown due to field limit.`, inline: false });
        }
    } else {
        const ev = events[0];
        embed.addFields(
            { name: "Current Weather Event:", value: ev.name || "Unknown", inline: false },
            { name: "Ends At:", value: `<t:${ev.endsAtUnix}:t> (<t:${ev.endsAtUnix}:R>)`, inline: false }
        );
    }

    await handleWeatherRoles(bot, guild);
    return sendWithMentions(channel, embed, weatherState.pingWeatherRoles);
}

async function sendStockPredictionsEmbed(bot, guild, channel) {
    const data = await generateStockPredictions(bot, guild);
    const embed = baseEmbed(bot, '#3366FF')
        .setTitle('Daily Stock Predictions')
        .setDescription(data.overview || 'No prediction data available.')
        .addFields(...(data.fields || []).slice(0, 24));
    const role = guild.roles.cache.find(r => r.name.toLowerCase() === 'stock predictions');
    if(role) {
        return channel.send({ content: `<@&${role.id}>`, embeds:[embed] });
    }
    return channel.send({ embeds:[embed] });
}

module.exports = {
    sendStockEmbed,
    sendEggStockEmbed,
    sendEventShopEmbed,
    sendTravelingMerchantStockEmbed,
    sendCosmeticStockEmbed,
    sendForeverPackEmbed,
    sendWeatherEmbed,
    sendStockPredictionsEmbed
};