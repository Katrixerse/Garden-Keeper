const { ChannelType, PermissionFlagsBits, PermissionsBitField } = require("discord.js");
const { cfg } = require('../../../config.json');

// leveling imports
const { addXP } = require('../../Handlers/leveling/levels');
const { generateLevelUpCard } = require('../../Handlers/leveling/levelUpCard');

// Economy Imports
const { modifyBalance } = require('../../Handlers/economy/economy');

// In-memory cooldown tracking for passive chat cash earnings
const chatCashCooldownMap = new Map(); // key: guildId:userId -> lastEarnedTs

module.exports = {
    name: "messageCreate",
    once: false,
    /**
     * @param {import('discord.js').Client} bot
     * @param {import('discord.js').Message} message
     */
    async execute(bot, message) {
        try {
            if (message.author.bot) return;
            if (message.channel.type === ChannelType.DM) return;
            if (!message.guild) return;

            const me = message.guild.members.me;
            if (!me) return;

            // Must be able to view/send in this channel
            const channelPerms = me.permissionsIn(message.channel);
            if (!channelPerms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages])) return;

            // Dynamic prefix per guild
            let prefix = 'g!';
            try {
                const { getPrefix } = require('../../Handlers/dbHandlers/prefix.js');
                prefix = await getPrefix(message.guild.id) || 'g!';
            } catch { /* fallback to default */ }
            if (!message.content?.startsWith(prefix)) {
                if (message.content?.includes?.("@here") || message.content?.includes?.("@everyone")) return;
                // Grant passive XP for normal messages
                try {
                    const minGain = cfg?.xp?.minGain ?? 15;
                    const maxGain = cfg?.xp?.maxGain ?? 24;
                    const cdSec = cfg?.xp?.cooldownSeconds ?? 60;
                    const gainRange = Math.max(0, maxGain - minGain + 1);
                    const gain = minGain + Math.floor(Math.random() * gainRange);
                    const result = await addXP(message.guild.id, message.author.id, gain, cdSec * 1000);
                    if (result.leveledUp) {
                        try {
                            const buffer = await generateLevelUpCard(message.author, result.previousLevel, result.level, gain);
                            await message.channel.send({ content: `${message.author}`, files: [{ attachment: buffer, name: 'levelup.png' }] });
                        } catch (err) {
                            message.channel.send(`${message.author} leveled up to **${result.level}**!`).catch(() => { });
                        }
                        // Level role rewards
                        try {
                            const { getLevelRoles } = require('../../Handlers/leveling/levelRoles');
                            const rows = await getLevelRoles(message.guild.id);
                            if(rows.length){
                                // Determine roles matching this level (exact match) or <=? (choose policy: exact level)
                                const exact = rows.filter(r => r.level === result.level);
                                if(exact.length){
                                    const member = message.member;
                                    // Determine any replace-mode roles among configured levels <= current level to enforce exclusivity
                                    const replaceRoles = new Set(rows.filter(r=>r.grantMode==='replace').map(r=>r.roleId));
                                    for(const rr of exact){
                                        if(!member.roles.cache.has(rr.roleId)){
                                            await member.roles.add(rr.roleId).catch(()=>{});
                                        }
                                    }
                                    // If any of the exact grants used replace mode, remove other replace-mode roles not just added
                                    if(exact.some(r=>r.grantMode==='replace')){
                                        for(const rid of replaceRoles){
                                            if(!exact.find(r=>r.roleId===rid) && message.member.roles.cache.has(rid)){
                                                await message.member.roles.remove(rid).catch(()=>{});
                                            }
                                        }
                                    }
                                }
                            }
                        } catch(e){ /* ignore role reward errors */ }
                    }
                } catch (e) { /* ignore xp errors */ }

                // Grant passive cash for normal messages (economy) with its own cooldown
                try {
                    const econCfg = cfg?.chatCash || cfg?.cash || {}; // allow either block name
                    const cashMin = Number.isFinite(econCfg.minGain) ? econCfg.minGain : 5;
                    const cashMax = Number.isFinite(econCfg.maxGain) ? econCfg.maxGain : 10;
                    const cashCdSec = Number.isFinite(econCfg.cooldownSeconds) ? econCfg.cooldownSeconds : 60;
                    if (cashMax >= cashMin && cashMin >= 0) {
                        const key = `${message.guild.id}:${message.author.id}`;
                        const now = Date.now();
                        const last = chatCashCooldownMap.get(key) || 0;
                        if (now - last >= cashCdSec * 1000) {
                            const range = Math.max(0, cashMax - cashMin + 1);
                            const gain = cashMin + Math.floor(Math.random() * range);
                            if (gain > 0) {
                                await modifyBalance(message.guild.id, message.author.id, gain);
                                chatCashCooldownMap.set(key, now);
                            }
                        }
                    }
                } catch (e) { /* ignore cash errors */ }
                return;
            }

            const args = message.content.slice(prefix.length).trim().split(/\s+/);
            const commandName = (args.shift() || "").toLowerCase();
            if (!commandName) return;

            let commandFile;
            try {
                if (bot.commands?.has(commandName)) {
                    commandFile = bot.commands.get(commandName);
                } else if (bot.aliases?.has(commandName)) {
                    commandFile = bot.commands.get(bot.aliases.get(commandName));
                }
            } catch (error) {
                console.error(`Error resolving command "${commandName}":`, error);
                return;
            }

            if (!commandFile || typeof commandFile.run !== "function") return;

            // Resolve required bot permissions for this command (check in-channel)
            const neededBotPerms = Array.isArray(commandFile.botPermissions)
                ? commandFile.botPermissions
                : (commandFile.botPermissions && commandFile.botPermissions !== "none")
                    ? [commandFile.botPermissions]
                    : [];

            if (neededBotPerms.length && !channelPerms.has(neededBotPerms)) {
                const missing = new PermissionsBitField(neededBotPerms).toArray().join(", ");
                await message.channel.send(`I am missing the following permission(s) here: ${missing}`).catch(() => { });
                return;
            }

            // Resolve required user permissions (guild-level check)
            const neededUserPerms = Array.isArray(commandFile.userPermissions)
                ? commandFile.userPermissions
                : (commandFile.userPermissions && commandFile.userPermissions !== "none")
                    ? [commandFile.userPermissions]
                    : [];

            if (neededUserPerms.length && !message.member.permissions.has(neededUserPerms)) {
                await message.reply("You lack required permissions for this command.").catch(() => { });
                return;
            }

            console.log(
                `[(Command) Guild: ${message.guild.name}] [User: ${message.author.tag}] [${commandName}] [${args.length ? args.join(" ").slice(0, 50) : "no args"}]`
            );

            await commandFile.run(bot, prefix, message, args);
        } catch (error) {
            console.error("messageCreate handler error:", error);
            try { await message.reply("There was an error executing that command."); } catch { }
        }
    },
};