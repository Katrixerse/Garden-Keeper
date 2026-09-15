const fs = require("fs");
const path = require("path");

const DEFAULT_CATEGORIES = ["Client", "Guild"];

function asArray(val, fallback = []) {
    if (Array.isArray(val)) return val;
    if (val == null) return fallback;
    return [val].filter(Boolean);
}

module.exports = (bot, options = {}) => {
    const categories = asArray(options.categories, DEFAULT_CATEGORIES);
    const clearBeforeLoad = options.clearBeforeLoad ?? false;

    const baseDir = path.resolve(__dirname, "..", "Events");
    const totals = { loaded: 0, skipped: 0, errors: 0 };

    for (const category of categories) {
        const categoryDir = path.join(baseDir, category);
        if (!fs.existsSync(categoryDir)) {
            console.warn(`[Events] Category missing, skipping: ${category}`);
            continue;
        }

        let entries;
        try {
            entries = fs.readdirSync(categoryDir, { withFileTypes: true });
        } catch (e) {
            console.error(`[Events] Failed to read ${category}:`, e?.message || e);
            totals.errors++;
            continue;
        }

        let loadedInCategory = 0;

        for (const entry of entries) {
            if (!entry.isFile()) continue;
            const isJs = entry.name.endsWith(".js") || entry.name.endsWith(".cjs");
            if (!isJs) continue;
            if (entry.name.startsWith("_")) { // allow disabling by prefixing _
                totals.skipped++;
                continue;
            }

            const fullPath = path.join(categoryDir, entry.name);
            const fileName = entry.name.replace(/\.(c?js)$/, "");

            try {
                if (clearBeforeLoad && require.cache[require.resolve(fullPath)]) {
                    delete require.cache[require.resolve(fullPath)];
                }

                const mod = require(fullPath);
                if (!mod) {
                    console.warn(`[Events] Skipping (no export): ${category}/${entry.name}`);
                    totals.skipped++;
                    continue;
                }

                // Support two shapes:
                // 1) export function (bot, ...args) {}
                // 2) export { name, once?, execute(interaction) {} }
                const eventName = typeof mod.name === "string" ? mod.name : fileName;
                const once = typeof mod.once === "boolean" ? mod.once : (eventName === "clientReady");
                const execute =
                    typeof mod === "function" ? mod
                    : typeof mod.execute === "function" ? mod.execute
                    : null;

                if (!eventName || !execute) {
                    console.warn(`[Events] Invalid event in ${category}/${entry.name} (requires export function or { name, execute }).`);
                    totals.skipped++;
                    continue;
                }

                const handler = async (...args) => {
                    try {
                        await execute(bot, ...args);
                    } catch (err) {
                        console.error(`[Events] ${eventName} handler error:`, err?.stack || err?.message || err);
                    }
                };

                if (once) bot.once(eventName, handler);
                else bot.on(eventName, handler);

                loadedInCategory++;
                totals.loaded++;
            } catch (e) {
                console.error(`[Events] Error loading ${category}/${entry.name}:`, e?.message || e);
                totals.errors++;
            }
        }

        console.log(`[Events] ${category}: loaded ${loadedInCategory}, total so far ${totals.loaded}.`);
    }

    console.log(`[Events] Done. Loaded: ${totals.loaded}, Skipped: ${totals.skipped}, Errors: ${totals.errors}.`);
};