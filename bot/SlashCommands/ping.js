const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Show bot latency")
        .setDMPermission(false),
    cooldownMs: 2000,
    async execute(interaction) {
        const sent = await interaction.reply({ content: "Pinging...", fetchReply: true });
        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const api = Math.round(interaction.client.ws.ping || 0);
        await interaction.editReply({ content: `Pong! Latency: ${latency}ms • API: ${api}ms` });
    }
};