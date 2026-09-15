const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { addWarn } = require("../../Handlers/modHandlers/warningSystem");

function getId(arg) { return arg?.match?.(/\d{17,20}/)?.[0]; }

module.exports = {
    name: "warn",
    aliases: [],
    description: "Warn a member",
    usage: "warn @user [reason]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const invoker = message.member;
        if (!invoker.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("Missing permission: Moderate Members.");

        const id = getId(args[0]);
        if (!id) return message.reply(`Usage: ${prefix || "!"}warn @user [reason]`);
        const target = await message.guild.members.fetch(id).catch(() => null);
        if (!target) return message.reply("User not found.");
        if (target.id === invoker.id) return message.reply("You cannot warn yourself.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        const res = addWarn(message.guild.id, target.id, invoker.id, reason);

        await message.channel.send(`Warned ${target.user.tag}. Case #${res.index}. Reason: ${reason}`);
        try {
            const { getAuditSettings, logAction } = require('../../Handlers/modHandlers/auditLog.js');
            const a = await getAuditSettings(message.guild.id);
            const caseId = await logAction(message.guild.id, 'warn', { targetId: target.id, moderatorId: invoker.id, reason, extra:{ case: res.index } });
            if(a.enabled && a.channelId){
                const ch = message.guild.channels.cache.get(a.channelId);
                if(ch && ch.isTextBased()){
                    const embed = new EmbedBuilder()
                        .setTitle('Warn Issued')
                        .addFields(
                            { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                            { name: 'Moderator', value: `${invoker.user.tag}`, inline: true },
                            { name: 'Case', value: `#${caseId || res.index}` , inline: true },
                            { name: 'Reason', value: reason || 'None', inline: false }
                        )
                        .setColor(0xFAA61A)
                        .setTimestamp();
                    ch.send({ embeds:[embed] }).catch(()=>{});
                }
            }
        } catch {}
    }
};