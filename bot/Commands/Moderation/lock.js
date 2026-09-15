const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "lock",
    aliases: ["lockdown"],
    description: "Lock the current channel (deny @everyone SendMessages)",
    usage: "lock",
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

        await message.channel.permissionOverwrites.edit(
            message.guild.roles.everyone.id,
            { SendMessages: false },
            { reason: `Locked by ${message.author.tag}` }
        ).catch(err => message.reply(`Lock failed: ${err?.message || err}`));

        return message.channel.send("Channel locked.");
    }
};