const { PermissionsBitField } = require("discord.js");

function getTarget(message, arg) {
    const id = arg?.match?.(/\d{17,20}/)?.[0];
    return id ? message.guild.members.fetch(id).catch(() => null) : null;
}

module.exports = {
    name: "ban",
    aliases: ["b"],
    description: "Ban a member",
    usage: "ban @user [reason]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
        const invoker = message.member;

        if (!invoker.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply("Missing permission: Ban Members.");
        if (!me.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply("I need Ban Members permission.");

        const targetMention = args[0];
        if (!targetMention) return message.reply(`Usage: ${prefix || "!"}ban @user [reason]`);

        const target = await getTarget(message, targetMention);
        if (!target) return message.reply("User not found.");
        if (!target.bannable) return message.reply("I cannot ban that user.");
        if (invoker.id === target.id) return message.reply("You cannot ban yourself.");

        if (target.roles.highest.position >= invoker.roles.highest.position && invoker.id !== message.guild.ownerId)
            return message.reply("That user has equal or higher role than you.");
        if (target.roles.highest.position >= me.roles.highest.position)
            return message.reply("That user has equal or higher role than my highest role.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.ban({ reason: `${invoker.user.tag}: ${reason}`, deleteMessageSeconds: 0 })
            .catch(err => message.reply(`Ban failed: ${err?.message || err}`));

        await message.channel.send(`Banned ${target.user.tag}. Reason: ${reason}`);
        try {
            const { getAuditSettings, logAction } = require('../../Handlers/modHandlers/auditLog.js');
            const a = await getAuditSettings(message.guild.id);
            const caseId = await logAction(message.guild.id, 'ban', { targetId: target.id, moderatorId: invoker.id, reason });
            if(a.enabled && a.channelId){
                const ch = message.guild.channels.cache.get(a.channelId);
                if(ch && ch.isTextBased()) ch.send(`🛠️ Ban • Case #${caseId || '?'} • **${target.user.tag}** (${target.id}) by **${invoker.user.tag}** • ${reason}`).catch(()=>{});
            }
        } catch {}
    }
};