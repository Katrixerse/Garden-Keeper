const { PermissionsBitField } = require("discord.js");

function getTarget(message, arg) {
    const id = arg?.match?.(/\d{17,20}/)?.[0];
    return id ? message.guild.members.fetch(id).catch(() => null) : null;
}

module.exports = {
    name: "unmute",
    aliases: ["untimeout"],
    description: "Remove timeout from a member",
    usage: "unmute @user [reason]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
        const invoker = message.member;

        if (!invoker.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("Missing permission: Moderate Members.");
        if (!me.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("I need Moderate Members permission.");

        const targetMention = args[0];
        if (!targetMention) return message.reply(`Usage: ${prefix || "!"}unmute @user [reason]`);

        const target = await getTarget(message, targetMention);
        if (!target) return message.reply("User not found.");

        if (target.roles.highest.position >= invoker.roles.highest.position && invoker.id !== message.guild.ownerId)
            return message.reply("That user has equal or higher role than you.");
        if (target.roles.highest.position >= me.roles.highest.position)
            return message.reply("That user has equal or higher role than my highest role.");

        const reason = args.slice(1).join(" ") || "No reason provided";
        await target.timeout(null, `${invoker.user.tag}: ${reason}`)
            .catch(err => message.reply(`Unmute failed: ${err?.message || err}`));

        await message.channel.send(`Removed timeout from ${target.user.tag}. Reason: ${reason}`);
        const log = message.guild.channels.cache.find(c => c.name === "mod-logs");
        if (log) log.send(`Unmute: ${target.user.tag} by ${invoker.user.tag}. Reason: ${reason}`).catch(() => {});
    }
};