const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "purge",
    aliases: ["clear", "clean"],
    description: "Bulk delete messages (2-100). Optionally filter by user.",
    usage: "purge <count> [@user]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const me = message.guild.members.me || await message.guild.members.fetch(bot.user.id);
        const invoker = message.member;

        if (!invoker.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply("Missing permission: Manage Messages.");
        if (!me.permissions.has(PermissionsBitField.Flags.ManageMessages))
            return message.reply("I need Manage Messages permission.");

        const count = parseInt(args[0], 10);
        if (!Number.isInteger(count) || count < 2 || count > 100)
            return message.reply("Provide a count between 2 and 100.");

        const userId = args[1]?.match?.(/\d{17,20}/)?.[0];

        try {
            if (!userId) {
                const deleted = await message.channel.bulkDelete(count, true);
                return message.channel.send(`Deleted ${deleted.size} messages.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            } else {
                const fetched = await message.channel.messages.fetch({ limit: 100 });
                const toDelete = fetched.filter(m => m.author?.id === userId).first(count);
                const delAll = await message.channel.bulkDelete(toDelete, true);
                return message.channel.send(`Deleted ${delAll.size} messages from that user.`).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
            }
        } catch (err) {
            return message.reply(`Purge failed: ${err?.message || err}`);
        }
    }
};