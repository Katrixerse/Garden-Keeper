const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "slowmode",
    aliases: ["slow"],
    description: "Set channel slowmode (seconds). Use 0/off to disable.",
    usage: "slowmode <seconds>",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
        const invoker = message.member;

        if (!invoker.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("Missing permission: Manage Channels.");
        if (!me.permissions.has(PermissionsBitField.Flags.ManageChannels))
            return message.reply("I need Manage Channels permission.");

        const sec = args[0]?.toLowerCase() === "off" ? 0 : parseInt(args[0], 10);
        if (!Number.isInteger(sec) || sec < 0 || sec > 21600)
            return message.reply("Provide seconds between 0 and 21600 (6 hours).");

        try {
            await message.channel.setRateLimitPerUser(sec, `By ${message.author.tag}`);
            return message.channel.send(`Slowmode set to ${sec}s.`);
        } catch (err) {
            return message.reply(`Failed to set slowmode: ${err?.message || err}`);
        }
    }
};