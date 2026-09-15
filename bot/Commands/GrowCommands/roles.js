const {
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    MessageFlags
} = require("discord.js");
const fs = require("fs");

let stockRoles = JSON.parse(fs.readFileSync("./stockRoles.json", "utf8"));

function canManageRole(botMember, role) {
    return (
        botMember.permissions.has(PermissionsBitField.Flags.ManageRoles) &&
        botMember.roles.highest.position > role.position &&
        role.managed === false
    );
}

async function toggleMemberRoles(interaction, targetRoleIdsOrRoles) {
    const guild = interaction.guild;
    const member =
        guild.members.cache.get(interaction.user.id) ||
        (await guild.members.fetch(interaction.user.id));
    const botMember =
        guild.members.me ||
        (await guild.members.fetchMe?.().catch(() => null)) ||
        (await guild.members.fetch(interaction.client.user.id));

    const roleObjs = targetRoleIdsOrRoles.map(r => (typeof r === "string" ? guild.roles.cache.get(r) : r)).filter(Boolean);

    const toAdd = [];
    const toRemove = [];

    for (const role of roleObjs) {
        if (!role) {
            continue;
        }
        if (!canManageRole(botMember, role)) {
            continue;
        }
        if (member.roles.cache.has(role.id)) {
            toRemove.push(role);
        } else {
            toAdd.push(role);
        }
    }

    try {
        if (toAdd.length) await member.roles.add(toAdd, "Roles command selection");
        if (toRemove.length) await member.roles.remove(toRemove, "Roles command selection");
    } catch (err) {
        return interaction.reply({
            content: `Error applying roles: ${err?.message || err}`,
            flags: MessageFlags.Ephemeral
        });
    }

    const added = toAdd.map(r => r.name).join(", ") || "None";
    const removed = toRemove.map(r => r.name).join(", ") || "None";

    return interaction.reply({
        content:
            `Updated your roles.\n- Added: ${added}\n- Removed: ${removed}`,
        flags: MessageFlags.Ephemeral
    });
}

module.exports = {
    name: "roles",
    aliases: ["roles"],
    description: "Manage notification roles",
    usage: "roles",
    cooldownTime: "1",
    group: "info",
    botPermissions: ["none"],
    run: async (bot, prefix, message, args) => {
        const roleEmbed = new EmbedBuilder()
            .setAuthor({ name: `Stock Roles!`, iconURL: bot.user.avatarURL() })
            .setTitle("What roles would you like to change?")
            .setDescription("Choose which notifications you want to receive. Selecting toggles the role on/off.")
            .setColor(`#F49A32`);

        const seedRolesBtn = new ButtonBuilder().setCustomId("seed").setLabel("Seed roles").setStyle(ButtonStyle.Primary);
        const gearRolesBtn = new ButtonBuilder().setCustomId("gear").setLabel("Gear roles").setStyle(ButtonStyle.Primary);
        const eggRolesBtn = new ButtonBuilder().setCustomId("egg").setLabel("Egg roles").setStyle(ButtonStyle.Primary);
        const otherRolesBtn = new ButtonBuilder().setCustomId("misc").setLabel("Other roles").setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(seedRolesBtn, gearRolesBtn, eggRolesBtn, otherRolesBtn);

        const initialMessage = await message.channel.send({
            embeds: [roleEmbed],
            components: [row]
        });

        if (!initialMessage) {
            return message.channel.send("Failed to send the initial message. Please try again later.");
        }

        const filter = (i) => i.user.id === message.author.id && i.message.id === initialMessage.id;
        const collector = initialMessage.createMessageComponentCollector({
            filter,
            time: 60_000
        });

        collector.on("collect", async (interaction) => {
            // Buttons -> present a select
            if (interaction.customId === "seed") {
                const getSeedOptions = () =>
                    (stockRoles.seedRoles || []).map((role) => ({
                        label: role.name,
                        value: role.id
                    }));

                const seedSelect = new StringSelectMenuBuilder()
                    .setCustomId("seedSelect")
                    .setPlaceholder("Select seed roles")
                    .setMinValues(1)
                    .setMaxValues(Math.max(1, Math.min(25, getSeedOptions().length || 1)))
                    .addOptions(getSeedOptions());

                const seedRow = new ActionRowBuilder().addComponents(seedSelect);
                return interaction.update({ content: "Select seed roles to toggle:", components: [seedRow], embeds: [] });
            }

            if (interaction.customId === "gear") {
                const getGearOptions = () =>
                    (stockRoles.gearRoles || []).map((role) => ({
                        label: role.name,
                        value: role.id
                    }));

                const gearSelect = new StringSelectMenuBuilder()
                    .setCustomId("gearSelect")
                    .setPlaceholder("Select gear roles")
                    .setMinValues(1)
                    .setMaxValues(Math.max(1, Math.min(25, getGearOptions().length || 1)))
                    .addOptions(getGearOptions());

                const gearRow = new ActionRowBuilder().addComponents(gearSelect);
                return interaction.update({ content: "Select gear roles to toggle:", components: [gearRow], embeds: [] });
            }

            if (interaction.customId === "egg") {
                const getEggOptions = () =>
                    (stockRoles.eggRoles || []).map((role) => ({
                        label: role.name,
                        value: role.id
                    }));

                const eggSelect = new StringSelectMenuBuilder()
                    .setCustomId("eggSelect")
                    .setPlaceholder("Select egg roles")
                    .setMinValues(1)
                    .setMaxValues(Math.max(1, Math.min(25, getEggOptions().length || 1)))
                    .addOptions(getEggOptions());

                const eggRow = new ActionRowBuilder().addComponents(eggSelect);
                return interaction.update({ content: "Select egg roles to toggle:", components: [eggRow], embeds: [] });
            }

            if (interaction.customId === "misc") {
                // Map menu values to role names in the guild
                const miscOptions = [
                    { label: "Weather", value: "misc_weather", roleName: "Weather Alerts" },
                    { label: "Event Stock", value: "misc_event", roleName: "Event Stock" },
                    { label: "Cosmetic", value: "misc_cosmetic", roleName: "Cosmetics Stock" },
                    { label: "Traveling Merchant", value: "misc_merchant", roleName: "Traveling Merchant" }
                ];

                const miscSelect = new StringSelectMenuBuilder()
                    .setCustomId("miscSelect")
                    .setPlaceholder("Select misc roles")
                    .setMinValues(1)
                    .setMaxValues(miscOptions.length)
                    .addOptions(miscOptions.map(({ label, value }) => ({ label, value })));

                const miscRow = new ActionRowBuilder().addComponents(miscSelect);
                return interaction.update({ content: "Select misc roles to toggle:", components: [miscRow], embeds: [] });
            }

            // Select menus -> toggle roles
            if (interaction.customId === "seedSelect" || interaction.customId === "gearSelect" || interaction.customId === "eggSelect") {
                const selectedRoleIds = interaction.values;
                return toggleMemberRoles(interaction, selectedRoleIds);
            }

            if (interaction.customId === "miscSelect") {
                const mapValueToRoleName = {
                    misc_weather: "Weather Alerts",
                    misc_event: "Event Stock",
                    misc_cosmetic: "Cosmetics Stock",
                    misc_merchant: "Traveling Merchant"
                };
                const roles = interaction.values
                    .map((v) => interaction.guild.roles.cache.find((r) => r.name === mapValueToRoleName[v]))
                    .filter(Boolean);

                return toggleMemberRoles(interaction, roles);
            }

            return interaction.reply({ content: "Invalid selection. Please try again.", flags: MessageFlags.Ephemeral });
        });

        collector.on("end", async () => {
            try {
                const disabled = initialMessage.components.map((row) => {
                    const newRow = ActionRowBuilder.from(row);
                    newRow.components = newRow.components.map((c) => ButtonBuilder.from(c).setDisabled(true));
                    return newRow;
                });
                await initialMessage.edit({ components: disabled }).catch(() => {});
            } catch {}
        });
    }
};