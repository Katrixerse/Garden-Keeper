const fs = require("fs");
const path = require("path");

const DEFAULT_CATEGORIES = ["Economy", "Giveaway", "GrowCommands", "Leveling", "Moderation", "Utility"];

function asArray(val, fallback = []) {
    if (Array.isArray(val)) return val;
    if (val == null) return fallback;
    return [val].filter(Boolean);
}

module.exports = (bot, options = {}) => {
    const categories = asArray(options.categories, DEFAULT_CATEGORIES);
    const clearBeforeLoad = options.clearBeforeLoad ?? false;

    // Ensure maps exist
    bot.commands ||= new Map();
    bot.aliases ||= new Map();
    bot.description ||= new Map();
    bot.cooldownTime ||= new Map();

    if (clearBeforeLoad) {
        bot.commands.clear();
        bot.aliases.clear();
        bot.description.clear();
        bot.cooldownTime.clear();
    }

    const baseDir = path.resolve(__dirname, "..", "Commands");
    const totals = { loaded: 0, skipped: 0, errors: 0 };

    for (const category of categories) {
        const categoryDir = path.join(baseDir, category);
        if (!fs.existsSync(categoryDir)) {
            console.warn(`[Commands] Category missing, skipping: ${category}`);
            continue;
        }

        let files;
        try {
            files = fs.readdirSync(categoryDir, { withFileTypes: true });
        } catch (e) {
            console.error(`[Commands] Failed to read ${category}:`, e?.message || e);
            totals.errors++;
            continue;
        }

        let loadedInCategory = 0;

        for (const entry of files) {
            if (!entry.isFile()) continue;
            if (!entry.name.endsWith(".js") && !entry.name.endsWith(".cjs")) continue;

            const fullPath = path.join(categoryDir, entry.name);

            try {
                // Bust cache on reload if desired
                if (clearBeforeLoad && require.cache[require.resolve(fullPath)]) {
                    delete require.cache[require.resolve(fullPath)];
                }

                const mod = require(fullPath);
                const cmd = mod && typeof mod === "object" ? mod : null;

                if (!cmd) {
                    console.warn(`[Commands] Skipping (no export): ${entry.name}`);
                    totals.skipped++;
                    continue;
                }

                // Allow commands to be disabled
                if (cmd.disabled) {
                    console.log(`[Commands] Disabled, skipping: ${cmd.name || entry.name}`);
                    totals.skipped++;
                    continue;
                }

                // Validate required fields
                if (!cmd.name || typeof cmd.name !== "string" || typeof cmd.run !== "function") {
                    console.warn(`[Commands] Invalid command shape in ${entry.name} (requires name:string & run:function).`);
                    totals.skipped++;
                    continue;
                }

                // Prevent duplicates
                if (bot.commands.has(cmd.name)) {
                    console.warn(`[Commands] Duplicate command name "${cmd.name}" in ${entry.name}; skipping.`);
                    totals.skipped++;
                    continue;
                }

                // Defaults
                const aliases = asArray(cmd.aliases, []);
                const description = typeof cmd.description === "string" ? cmd.description : "";
                const cooldown = Number.isFinite(Number(cmd.cooldownTime)) ? Number(cmd.cooldownTime) : 1;

                // Attach category for help systems
                cmd.category = cmd.category || category;

                // Register
                bot.commands.set(cmd.name, cmd);
                bot.description.set(cmd.name, description);
                bot.cooldownTime.set(cmd.name, cooldown);

                // Aliases (warn on collisions)
                for (const alias of aliases) {
                    if (!alias) continue;
                    if (bot.aliases.has(alias)) {
                        console.warn(`[Commands] Alias "${alias}" already mapped to "${bot.aliases.get(alias)}"; skipping alias in ${entry.name}.`);
                        continue;
                    }
                    bot.aliases.set(alias, cmd.name);
                }

                loadedInCategory++;
                totals.loaded++;
            } catch (e) {
                console.error(`[Commands] Error loading ${category}/${entry.name}:`, e?.message || e);
                totals.errors++;
            }
        }

        console.log(`[Commands] ${category}: loaded ${loadedInCategory}, total so far ${totals.loaded}.`);
    }

    console.log(`[Commands] Done. Loaded: ${totals.loaded}, Skipped: ${totals.skipped}, Errors: ${totals.errors}`);
};