const { PermissionsBitField } = require("discord.js");
const ms = require("ms");

function getTarget(message, arg) {
    const id = arg?.match?.(/\d{17,20}/)?.[0];
    return id ? message.guild.members.fetch(id).catch(() => null) : null;
}

module.exports = {
    name: "mute",
    aliases: ["timeout"],
    description: "Timeout a member for a duration",
    usage: "mute @user <duration> [reason]  e.g. mute @user 10m Spamming",
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
        const durationArg = args[1];
        if (!targetMention || !durationArg) return message.reply(`Usage: ${prefix || "!"}mute @user <duration> [reason]`);

        const msDuration = ms(durationArg);
        if (!msDuration || msDuration < 5_000 || msDuration > 28 * 24 * 60 * 60 * 1000)
            return message.reply("Invalid duration. Use 5s to 28d.");

        const target = await getTarget(message, targetMention);
        if (!target) return message.reply("User not found.");
        if (invoker.id === target.id) return message.reply("You cannot mute yourself.");

        if (target.roles.highest.position >= invoker.roles.highest.position && invoker.id !== message.guild.ownerId)
            return message.reply("That user has equal or higher role than you.");
        if (target.roles.highest.position >= me.roles.highest.position)
            return message.reply("That user has equal or higher role than my highest role.");

        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.timeout(msDuration, `${invoker.user.tag}: ${reason}`)
            .catch(err => message.reply(`Mute failed: ${err?.message || err}`));

        await message.channel.send(`Timed out ${target.user.tag} for ${ms(msDuration, { long: true })}. Reason: ${reason}`);
        const log = message.guild.channels.cache.find(c => c.name === "mod-logs");
        if (log) log.send(`Mute: ${target.user.tag} by ${invoker.user.tag} for ${ms(msDuration, { long: true })}. Reason: ${reason}`).catch(() => {});
    }
};