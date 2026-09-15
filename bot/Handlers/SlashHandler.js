const fs = require("fs");
const path = require("path");
const { Collection, PermissionsBitField } = require("discord.js");

const DEFAULT_COOLDOWN_MS = 3000;

function loadSlashCommands(rootDir) {
    const commands = new Collection();
    const files = fs.readdirSync(rootDir).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const cmd = require(path.join(rootDir, file));
        if (cmd?.data?.name && typeof cmd.execute === "function") {
            commands.set(cmd.data.name, cmd);
        } else {
            console.warn(`[Slash] Skipping ${file}: missing data.name or execute`);
        }
    }
    return commands;
}

async function registerSlash(bot, commands, guildId) {
    const data = Array.from(commands.values()).map(c => c.data.toJSON());
    if (guildId) {
        const guild = bot.guilds.cache.get(guildId);
        if (!guild) throw new Error(`Guild ${guildId} not found in cache.`);
        await guild.commands.set(data);
        console.log(`[Slash] Registered ${data.length} guild commands in ${guild.name}`);
    } else {
        await bot.application.commands.set(data);
        console.log(`[Slash] Registered ${data.length} global commands`);
    }
}

function ensurePermissions(interaction, command) {
    // Optional per-command permission gate via command.requiredBotPerms / requiredUserPerms
    const requiredBot = command.requiredBotPerms || [];
    const requiredUser = command.requiredUserPerms || [];

    const botMember = interaction.guild?.members.me;
    const member = interaction.member;

    if (requiredBot.length && (!botMember || !botMember.permissions.has(requiredBot))) {
        throw new Error(`I’m missing permissions: ${requiredBot.map(p => PermissionsBitField.Flags[p] ? p : p).join(", ")}`);
    }
    if (requiredUser.length && (!member || !member.permissions?.has(requiredUser))) {
        throw new Error(`You’re missing permissions: ${requiredUser.map(p => PermissionsBitField.Flags[p] ? p : p).join(", ")}`);
    }
}

function setupCooldowns() {
    const map = new Map(); // cmdName -> (userId -> lastTs)
    return {
        check: (cmdName, userId, cooldownMs) => {
            const now = Date.now();
            if (!map.has(cmdName)) map.set(cmdName, new Map());
            const userMap = map.get(cmdName);
            const last = userMap.get(userId) || 0;
            const cd = cooldownMs ?? DEFAULT_COOLDOWN_MS;
            if (now - last < cd) return cd - (now - last);
            userMap.set(userId, now);
            return 0;
        }
    };
}

function setupSlashCommands(bot, options = {}) {
    const rootDir = path.resolve(process.cwd(), "./bot/SlashCommands");
    if (!fs.existsSync(rootDir)) fs.mkdirSync(rootDir, { recursive: true });

    const commands = loadSlashCommands(rootDir);
    bot.slashCommands = commands;

    const cooldowns = setupCooldowns();

    bot.once("clientReady", async () => {
        try {
            await registerSlash(bot, commands, options.guildId);
        } catch (err) {
            console.error("[Slash] Registration failed:", err?.message || err);
        }
    });

    bot.on("interactionCreate", async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        const command = commands.get(interaction.commandName);
        if (!command) return;

        try {
            const remaining = cooldowns.check(command.data.name, interaction.user.id, command.cooldownMs);
            if (remaining > 0) {
                return interaction.reply({ content: `Slow down. Try again in ${(remaining / 1000).toFixed(1)}s.`, ephemeral: true });
            }

            // Permission gates (optional per-command fields)
            if (interaction.inGuild()) {
                ensurePermissions(interaction, command);
            }

            await command.execute(interaction);
        } catch (err) {
            const msg = err?.message || "An error occurred.";
            if (interaction.deferred || interaction.replied) {
                await interaction.followUp({ content: `Error: ${msg}`, ephemeral: true }).catch(() => {});
            } else {
                await interaction.reply({ content: `Error: ${msg}`, ephemeral: true }).catch(() => {});
            }
            console.error(`[Slash] ${interaction.commandName} error:`, err);
        }
    });
}

module.exports = { setupSlashCommands };