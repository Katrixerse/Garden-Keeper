const { checkNewStock } = require("../../Handlers/StockHandlers/StockHandler.js");
const { checkActiveWeather } = require("../../Handlers/StockHandlers/WeatherHandler.js");
const { createTables } = require("../../Handlers/dbHandlers/createTables.js");
// Add: ensure giveaway tables on startup
const { ensureGiveawayTables } = require("../../Handlers/giveawayHandlers/giveawayManager.js");
const { setupSlashCommands } = require('../../Handlers/SlashHandler.js');
const { setupGiveawayScheduler } = require("../../Handlers/giveawayHandlers/GiveawayScheduler.js");
const { startWatcher: startYouTubeWatcher } = require('../../Handlers/YouTube/youtubeWatcher.js');
const { startTwitchWatcher } = require('../../Handlers/Twitch/twitchWatcher.js');

module.exports = {
    name: "clientReady",
    once: true,
    async execute(bot) {
        try {
            bot.user.setPresence({ activities: [{ name: `g!help | Grow A Garden.` }], status: "online" });
        } catch {
            // Failed to set presence
        }

        console.log(`${bot.user.username} loaded. Currently in ${bot.guilds.cache.size} server(s) with ${bot.users.cache.size} users cached.`);

    // Website already auto-started; could pass bot reference globally if needed later.

        // Ensure required tables exist at startup
    try {
            await createTables();
            await ensureGiveawayTables();
        } catch (error) {
            console.error("DB tables init failed:", error?.message || error);
        }

        try {
            const guilds = [...bot.guilds.cache.values()];
            for (const guild of guilds) {
                if (!guild?.available) continue;
                try {
                    await guild.channels.fetch().catch(() => { });
                    checkNewStock(bot, guild);
                    checkActiveWeather(bot, guild);
                } catch (err) {
                    console.error(`Ready guild init failed for ${guild?.name}:`, err?.message || err);
                }
            }
        } catch (error) {
            console.error("Ready loop error:", error?.message || error);
        }

    // Start background watchers
    try { startYouTubeWatcher(bot); } catch {}
    try { startTwitchWatcher(bot); } catch {}
    },
};