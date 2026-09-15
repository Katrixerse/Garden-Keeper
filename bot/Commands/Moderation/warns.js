const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { listWarns } = require("../../Handlers/modHandlers/warningSystem");

function getIdOrSelf(message, arg) {
    const id = arg?.match?.(/\d{17,20}/)?.[0];
    return id || message.author.id;
}

module.exports = {
    name: "warns",
    aliases: ["infractions"],
    description: "List warnings for a user",
    usage: "warns [@user]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const invoker = message.member;
        if (!invoker.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("Missing permission: Moderate Members.");

        const id = getIdOrSelf(message, args[0]);
        const warns = listWarns(message.guild.id, id);
        if (!warns.length) return message.reply("No warnings found.");

        const desc = warns
            .map((w, i) => `#${i + 1} • by <@${w.moderatorId}> • ${new Date(w.at).toLocaleString()} • ${w.reason}`)
            .join("\n")
            .slice(0, 3900);

        const embed = new EmbedBuilder()
            .setTitle(`Warnings for ${id === message.author.id ? "you" : `<@${id}>`}`)
            .setDescription(desc)
            .setColor(0xFAA61A)
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};