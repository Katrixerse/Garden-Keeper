const { PermissionsBitField } = require("discord.js");
const fs = require("fs");

function loadStockRoles() {
    try {
        const raw = fs.readFileSync("./stockRoles.json", "utf8");
        const json = JSON.parse(raw);
        return {
            seedRoles: json.seedRoles || [],
            gearRoles: json.gearRoles || [],
            eggRoles: json.eggRoles || []
        };
    } catch {
        return { seedRoles: [], gearRoles: [], eggRoles: [] };
    }
}

function uniqueCaseInsensitive(names) {
    const seen = new Set();
    const out = [];
    for (const n of names) {
        const key = String(n).toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(String(n).trim());
        }
    }
    return out.filter(Boolean);
}

async function ensureRole(guild, name, mentionable = true) {
    const existing = guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());
    if (existing) return { created: false, role: existing };

    try {
        const role = await guild.roles.create({
            name,
            mentionable,
            reason: "CreateRoles command"
        });
        return { created: true, role };
    } catch (err) {
        return { created: false, role: null, error: err };
    }
}

module.exports = {
    name: "createroles",
    aliases: ["makeroles", "initroles"],
    description: "Create notification roles from stockRoles.json (seed, gear, egg) plus misc roles.",
    usage: "createroles [all|seed|gear|egg|misc]",
    cooldownTime: "1",
    group: "admin",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const guild = message.guild;

        // Permission checks
        const invoker = guild.members.cache.get(message.author.id) || (await guild.members.fetch(message.author.id));
        if (!invoker.permissions.has(PermissionsBitField.Flags.ManageRoles) &&
            !invoker.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("You need Manage Roles to run this.");
        }

        const me = guild.members.me || (await guild.members.fetch(bot.user.id));
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply("I need Manage Roles to create roles.");
        }

        const category = String(args[0] || "all").toLowerCase();
        const stock = loadStockRoles();

        const fromList = (arr) => arr.map(r => r?.name).filter(Boolean);

        const miscNames = ["Weather Alerts", "Event Stock", "Cosmetics Stock", "Traveling Merchant"];

        let targetNames = [];
        if (category === "seed") targetNames = fromList(stock.seedRoles);
        else if (category === "gear") targetNames = fromList(stock.gearRoles);
        else if (category === "egg") targetNames = fromList(stock.eggRoles);
        else if (category === "misc") targetNames = miscNames;
        else targetNames = [...fromList(stock.seedRoles), ...fromList(stock.gearRoles), ...fromList(stock.eggRoles), ...miscNames];

        targetNames = uniqueCaseInsensitive(targetNames);

        if (targetNames.length === 0) {
            return message.reply("No roles to create. Check stockRoles.json or pick a valid category.");
        }

        const created = [];
        const skipped = [];
        const failed = [];

        for (const name of targetNames) {
            const res = await ensureRole(guild, name, true);
            if (res.role && !res.created) skipped.push(res.role.name);
            else if (res.role && res.created) created.push(res.role.name);
            else failed.push(`${name} (${res.error?.message || "unknown error"})`);
        }

        const summary =
            `Roles created: ${created.length ? created.join(", ") : "None"}\n` +
            `Already existed: ${skipped.length ? skipped.join(", ") : "None"}\n` +
            `Failed: ${failed.length ? failed.join(" | ") : "None"}`;
        message.channel.send(summary);
    }
};