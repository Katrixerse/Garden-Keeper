const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "unlock",
    aliases: [],
    description: "Unlock the current channel (restore @everyone SendMessages)",
    usage: "unlock",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message) => {
        const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
        const invoker = message.member;

        if (!invoker.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("Missing permission: Manage Channels.");
        if (!me.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("I need Manage Channels permission.");

        // Remove explicit overwrite for everyone if present; otherwise set SendMessages to null
        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone.id,
            { SendMessages: null },
            { reason: `Unlocked by ${message.author.tag}` }
        ).catch(err => message.reply(`Unlock failed: ${err?.message || err}`));

        return message.channel.send("Channel unlocked.");
    }
};