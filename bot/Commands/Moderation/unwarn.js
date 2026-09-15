const { PermissionsBitField } = require("discord.js");
const { removeWarn, listWarns } = require("../../Handlers/modHandlers/warningSystem");

function getId(arg) { return arg?.match?.(/\d{17,20}/)?.[0]; }

module.exports = {
    name: "unwarn",
    aliases: ["delwarn", "removewarn"],
    description: "Remove a warning from a member",
    usage: "unwarn @user [caseNumber]",
    cooldownTime: "2",
    group: "moderation",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const invoker = message.member;
        if (!invoker.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply("Missing permission: Moderate Members.");

        const id = getId(args[0]);
        if (!id) return message.reply(`Usage: ${prefix || "!"}unwarn @user [caseNumber]`);
        const warns = listWarns(message.guild.id, id);
        if (!warns.length) return message.reply("That user has no warnings.");

        const caseNum = parseInt(args[1], 10) || warns.length;
        const removed = removeWarn(message.guild.id, id, caseNum);
        if (!removed) return message.reply("Invalid case number.");

        return message.channel.send(`Removed warning #${removed.index} from <@${id}>. Reason was: ${removed.entry?.reason || "None"}`);
    }
};