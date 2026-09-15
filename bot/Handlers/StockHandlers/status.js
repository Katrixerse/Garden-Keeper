const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const ms = require("ms");
const request = require("node-superfetch");

// Cache the bot's status message and last status per guild
const guildStatusCache = new Map(); // guild.id -> { messageId }
const lastStatusByGuild = new Map(); // guild.id -> { apiStatus }
const statusIntervals = new Map(); // guild.id -> interval handle
const INTERVAL_MS = 60000;
const WEBSITE_URL = 'https://katrixerse.com/';
const WEBSITE_POLL_MIN_INTERVAL = 20000; // 20s minimum between polls

// Global website status cache (shared across guilds)
const websiteStatusCache = {
    lastCode: 'N/A',
    lastChecked: 0,
    inFlight: false
};

function statusColor(code) {
    if (code === 200) return 0x57F287; // green
    if (typeof code === "number") return 0xED4245; // red
    return 0xFAA61A; // yellow
}

function buildStatusEmbed(bot, siteCode, apiCode) {
    const siteOk = siteCode === 200;
    const apiOk = apiCode === 200;
    const botOk = bot.isReady();
    const siteText = siteOk ? `Online <:checkmark:1399765031343620227>` : `Offline (Code: ${siteCode}) <:error:1399765072191946812>`;
    const apiText = apiOk ? `Online <:checkmark:1399765031343620227>` : `Offline (Code: ${apiCode}) <:error:1399765072191946812>`;
    const botText = botOk ? `Online <:checkmark:1399765031343620227>` : `Offline <:error:1399765072191946812>`;
    const ping = typeof bot.ws?.ping === 'number' ? `${Math.round(bot.ws.ping)}ms` : 'n/a';

    return new EmbedBuilder()
        .setAuthor({ name: 'Grow a Garden', iconURL: bot.user?.avatarURL() ?? undefined })
        .addFields(
            { name: 'Bot', value: botText, inline: true },
            { name: 'Website', value: siteText, inline: true },
            { name: 'API', value: apiText, inline: true },
            { name: 'WS Ping', value: ping, inline: true },
            { name: 'Uptime', value: ms(bot.uptime || 0, { long: true }), inline: false }
        )
        .setColor(statusColor(apiCode === 'N/A' ? siteOk ? 200 : 500 : apiCode))
        .setTimestamp(new Date());
}

async function pollWebsiteStatus() {
    const now = Date.now();
    if (websiteStatusCache.inFlight) return websiteStatusCache.lastCode;
    if (now - websiteStatusCache.lastChecked < WEBSITE_POLL_MIN_INTERVAL) return websiteStatusCache.lastCode;
    websiteStatusCache.inFlight = true;
    try {
        let res;
        try {
            res = await request.get(WEBSITE_URL).set('cache-control', 'no-cache');
            websiteStatusCache.lastCode = res.status || 0;
        } catch (e) {
            websiteStatusCache.lastCode = e?.status || 0;
        }
    } finally {
        websiteStatusCache.lastChecked = Date.now();
        websiteStatusCache.inFlight = false;
    }
    return websiteStatusCache.lastCode;
}

async function findOrCreateStatusMessage(channel, bot, canReadHistory) {
    // If we can read history, try to reuse/edit an existing message
    if (canReadHistory) {
        const cached = guildStatusCache.get(channel.guild.id);
        if (cached?.messageId) {
            try {
                const msg = await channel.messages.fetch(cached.messageId);
                if (msg?.editable) return msg;
            } catch {
                // ignore and continue
            }
        }

        try {
            const msgs = await channel.messages.fetch({ limit: 10 });
            const last = msgs.find(m => m.author.id === bot.user.id);
            if (last?.editable) {
                guildStatusCache.set(channel.guild.id, { messageId: last.id });
                return last;
            }
        } catch {
            // ignore
        }
    }

    // Otherwise, or if none found, send a new one
    const sent = await channel.send({ content: "Initializing status..." });
    guildStatusCache.set(channel.guild.id, { messageId: sent.id });
    return sent;
}

async function updateStatus(bot, guild) {
    if (!guild) return;
    const channel = guild.channels.cache.find(
        c => c.name === "status" && typeof c.isTextBased === "function" && c.isTextBased()
    );
    if (!channel) {
        console.error(`status channel not found in guild: ${guild.name}`);
        return;
    }

    // Resolve bot member and permissions
    const botMember =
        guild.members.me ||
        (await guild.members.fetchMe?.().catch(() => null)) ||
        (await guild.members.fetch(bot.user.id).catch(() => null));
    if (!botMember) {
        console.error(`Could not resolve bot member in guild: ${guild.name}`);
        return;
    }

    const perms = channel.permissionsFor(botMember);
    if (!perms?.has(PermissionsBitField.Flags.ViewChannel)) {
        console.error(`Missing ViewChannel in #${channel.name} (${guild.name})`);
        return;
    }
    if (!perms.has(PermissionsBitField.Flags.SendMessages)) {
        console.error(`Missing SendMessages in #${channel.name} (${guild.name})`);
        return;
    }
    if (!perms.has(PermissionsBitField.Flags.EmbedLinks)) {
        console.error(`Missing EmbedLinks in #${channel.name} (${guild.name})`);
        return;
    }

    const canReadHistory = perms.has(PermissionsBitField.Flags.ReadMessageHistory);
    const message = await findOrCreateStatusMessage(channel, bot, canReadHistory);

    // Poll website status (shared) if stale
    await pollWebsiteStatus();
    const statusObj = lastStatusByGuild.get(guild.id) || { apiStatus: 'N/A' };
    const embed = buildStatusEmbed(bot, websiteStatusCache.lastCode, statusObj.apiStatus);

    if (canReadHistory && message?.editable) {
        await message.edit({ content: "", embeds: [embed] });
    } else {
        const sent = await channel.send({ embeds: [embed] });
        guildStatusCache.set(guild.id, { messageId: sent.id });
    }
}

function ensureInterval(bot, guild) {
    if (statusIntervals.has(guild.id)) return;
    const interval = setInterval(async () => {
        try {
            await updateStatus(bot, guild);
        } catch (e) {
            console.error(`Status interval error for guild ${guild?.name}:`, e?.message || e);
        }
    }, INTERVAL_MS);
    statusIntervals.set(guild.id, interval);
}

async function statusHandler(bot, guild, apiStatus) {
    try {
                // Cache latest API status per guild
                if (guild) {
                    const prev = lastStatusByGuild.get(guild.id) || {};
                    lastStatusByGuild.set(guild.id, { ...prev, apiStatus });
                }
        // Start interval once per guild
        if (guild) ensureInterval(bot, guild);
        // Also update immediately
        await updateStatus(bot, guild);
    } catch (err) {
        console.error("Failed to update status:", err?.message || err);
    }
}

module.exports = { statusHandler };