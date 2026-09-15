const { PermissionsBitField } = require("discord.js");
const ms = require("ms");

function getTargetId(arg) { return arg?.match?.(/\d{17,20}/)?.[0]; }

module.exports = {
    name: "tempban",
    aliases: ["tban"],
    description: "Temporarily ban a member",
    usage: "tempban @user <duration> [reason]",
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

        const id = getTargetId(args[0]);
        const durationArg = args[1];
        if (!id || !durationArg) return message.reply(`Usage: ${prefix || "!"}tempban @user <duration> [reason]`);

        const durMs = ms(durationArg);
        if (!durMs || durMs < 10_000 || durMs > 30 * 24 * 60 * 60 * 1000)
            return message.reply("Invalid duration. Use 10s to 30d.");

        const target = await message.guild.members.fetch(id).catch(() => null);
        if (!target) return message.reply("User not found.");
        if (invoker.id === target.id) return message.reply("You cannot ban yourself.");
        if (!target.bannable) return message.reply("I cannot ban that user.");
        if (target.roles.highest.position >= invoker.roles.highest.position && invoker.id !== message.guild.ownerId)
            return message.reply("That user has equal or higher role than you.");
        if (target.roles.highest.position >= me.roles.highest.position)
            return message.reply("That user has equal or higher role than my highest role.");

        const reason = args.slice(2).join(" ") || "No reason provided";
        await target.ban({ reason: `${invoker.user.tag}: ${reason}`, deleteMessageSeconds: 0 })
            .catch(err => message.reply(`Ban failed: ${err?.message || err}`));

        await message.channel.send(`Banned ${target.user.tag} for ${ms(durMs, { long: true })}. Reason: ${reason}`);

        const log = message.guild.channels.cache.find(c => c.name === "mod-logs");
        if (log) log.send(`Tempban: ${target.user.tag} by ${invoker.user.tag} for ${ms(durMs, { long: true })}. Reason: ${reason}`).catch(() => {});

        setTimeout(async () => {
            try {
                await message.guild.bans.remove(id, "Tempban expired");
                if (log) log.send(`Unbanned ${id} (tempban expired)`).catch(() => {});
            } catch {}
        }, durMs);
    }
};