const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const DEFAULT_CATEGORY = "Tickets";

module.exports = {
    name: "ticket",
    aliases: ["tickets"],
    description: "Post a ticket panel with a button that opens a modal.",
    usage: "ticket panel",
    cooldownTime: "2",
    group: "utility",
    botPermissions: ["none"],
    run: async (bot, prefix, message) => {
        try {
            if (!message.guild) return;

            // Require Manage Channels to post a panel
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return message.reply("You need Manage Channels to post a ticket panel.");
            }

            const embed = new EmbedBuilder()
                .setTitle("Support Tickets")
                .setDescription("Click the button below to open a ticket. You’ll be asked for a reason.")
                .setColor(0x57F287);

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_open_panel")
                    .setLabel("Open Ticket")
                    .setEmoji("🎫")
                    .setStyle(ButtonStyle.Primary)
            );

            await message.channel.send({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error("ticket panel error:", err);
            return message.reply(`Error: ${err?.message || err}`);
        }
    }
};