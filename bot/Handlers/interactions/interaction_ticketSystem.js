const {
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

const DEFAULT_CATEGORY = "Tickets";
const DEFAULT_SUPPORT_ROLE = "Support Team";
const LOG_CHANNEL_NAME = "ticket-logs";

function sanitizeName(str) {
    return String(str || "user")
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 20);
}

async function ensureCategory(guild, name) {
    let cat = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === name.toLowerCase()
    );
    if (cat) return cat;

    const me = guild.members.me || await guild.members.fetch(guild.client.user.id);
    if (!me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        throw new Error("Missing Manage Channels to create ticket category");
    }
    cat = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        reason: "Ticket system category"
    });
    return cat;
}

function getSupportRole(guild) {
    return guild.roles.cache.find(r => r.name.toLowerCase() === DEFAULT_SUPPORT_ROLE.toLowerCase()) || null;
}

function getLogChannel(guild) {
    return guild.channels.cache.find(c => c.type === ChannelType.GuildText && c.name === LOG_CHANNEL_NAME) || null;
}

async function createTranscript(channel) {
    const msgs = await channel.messages.fetch({ limit: 100 }).catch(() => null);
    if (!msgs) return { content: "No transcript available." };
    const lines = [...msgs.values()]
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
        .map(m => `[${new Date(m.createdTimestamp).toISOString()}] ${m.author?.tag || m.author?.id}: ${m.cleanContent || ""}`)
        .join("\n")
        .slice(0, 190000);
    return { content: "Transcript (last 100 messages):\n```\n" + lines + "\n```" };
}

module.exports = async (bot, interaction) => {
    try {
        // Open Ticket button -> show modal
        if (interaction.isButton() && interaction.customId === "ticket_open_panel") {
            if (!interaction.inGuild()) {
                return interaction.reply({ content: "Use this in a server.", flags: MessageFlags.Ephemeral });
            }
            const modal = new ModalBuilder()
                .setCustomId(`ticket_open_modal:${interaction.user.id}`)
                .setTitle("Open a Ticket");

            const reason = new TextInputBuilder()
                .setCustomId("ticket_reason")
                .setLabel("Reason (what do you need help with?)")
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(500);

            modal.addComponents(new ActionRowBuilder().addComponents(reason));
            return interaction.showModal(modal);
        }

        // Handle Open Ticket modal submit -> create channel
        if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_open_modal:")) {
            if (!interaction.inGuild()) {
                return interaction.reply({ content: "Use this in a server.", flags: MessageFlags.Ephemeral });
            }
            const ownerId = interaction.customId.split(":")[1];
            if (interaction.user.id !== ownerId) {
                return interaction.reply({ content: "This modal is not for you.", flags: MessageFlags.Ephemeral });
            }

            const guild = interaction.guild;
            const me = guild.members.me || await guild.members.fetch(guild.client.user.id);
            if (!me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: "I need Manage Channels to open tickets.", flags: MessageFlags.Ephemeral });
            }

            const member = await guild.members.fetch(interaction.user.id).catch(() => null);
            if (!member) {
                return interaction.reply({ content: "Member not found.", flags: MessageFlags.Ephemeral });
            }

            const reason = interaction.fields.getTextInputValue("ticket_reason")?.trim() || "n/a";

            // Ensure category
            const category = await ensureCategory(guild, DEFAULT_CATEGORY);

            // Prevent duplicates (owner in topic)
            const existing = guild.channels.cache.find(
                c => c.parentId === category.id && c.topic && c.topic.includes(`owner:${member.id}`)
            );
            if (existing) {
                return interaction.reply({ content: `You already have an open ticket: <#${existing.id}>`, flags: MessageFlags.Ephemeral });
            }

            const supportRole = getSupportRole(guild);
            const channelName = `ticket-${sanitizeName(member.user.username)}-${member.user.discriminator || "user"}`;

            // Overwrites
            const overwrites = [
                { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.ReadMessageHistory] },
                { id: me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.EmbedLinks] }
            ];
            if (supportRole) {
                overwrites.push({ id: supportRole.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] });
            }

            const ticket = await guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                parent: category.id,
                permissionOverwrites: overwrites,
                topic: `owner:${member.id} | opened:${Date.now()} | reason:${reason}`
            });

            const controlRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_add")
                    .setLabel("Add Member")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Close Ticket")
                    .setStyle(ButtonStyle.Danger)
            );

            const embed = new EmbedBuilder()
                .setTitle("Ticket Opened")
                .setDescription([
                    `Opened by: <@${member.id}>`,
                    `Reason: ${reason}`,
                    `Use the buttons below to add members or close this ticket.`
                ].join("\n"))
                .setColor(0x57F287)
                .setTimestamp();

            const mention = supportRole ? `<@&${supportRole.id}>` : "";
            await ticket.send({
                content: mention,
                embeds: [embed],
                components: [controlRow],
                allowedMentions: supportRole ? { roles: [supportRole.id], parse: [] } : { parse: [] }
            });

            return interaction.reply({ content: `Created ticket: <#${ticket.id}>`, flags: MessageFlags.Ephemeral });
        }

        // Add Member button -> show modal for user mention/ID
        if (interaction.isButton() && interaction.customId === "ticket_add") {
            if (!interaction.inGuild()) return;

            const channel = interaction.channel;
            if (!channel?.parent || channel.parent.name.toLowerCase() !== DEFAULT_CATEGORY.toLowerCase()) {
                return interaction.reply({ content: "Use this inside a ticket channel.", flags: MessageFlags.Ephemeral });
            }

            const ownerId = channel.topic?.match(/owner:(\d+)/)?.[1];
            const supportRole = getSupportRole(interaction.guild);
            const isOwner = ownerId && ownerId === interaction.user.id;
            const isStaff = supportRole && interaction.member.roles.cache.has(supportRole.id);
            const canManage = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
            if (!isOwner && !isStaff && !canManage) {
                return interaction.reply({ content: "You must be the ticket owner or support to add users.", flags: MessageFlags.Ephemeral });
            }

            const modal = new ModalBuilder()
                .setCustomId(`ticket_add_modal:${channel.id}`)
                .setTitle("Add Member to Ticket");

            const userField = new TextInputBuilder()
                .setCustomId("ticket_add_user")
                .setLabel("User mention or ID")
                .setPlaceholder("@User or 123456789012345678")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(userField));
            return interaction.showModal(modal);
        }

        // Handle Add Member modal -> edit permissions
        if (interaction.isModalSubmit() && interaction.customId.startsWith("ticket_add_modal:")) {
            if (!interaction.inGuild()) return;

            const channelId = interaction.customId.split(":")[1];
            const channel = interaction.guild.channels.cache.get(channelId);
            if (!channel) return interaction.reply({ content: "Channel not found.", flags: MessageFlags.Ephemeral });

            if (!channel.parent || channel.parent.name.toLowerCase() !== DEFAULT_CATEGORY.toLowerCase()) {
                return interaction.reply({ content: "This is not a ticket channel.", flags: MessageFlags.Ephemeral });
            }

            const ownerId = channel.topic?.match(/owner:(\d+)/)?.[1];
            const supportRole = getSupportRole(interaction.guild);
            const isOwner = ownerId && ownerId === interaction.user.id;
            const isStaff = supportRole && interaction.member.roles.cache.has(supportRole.id);
            const canManage = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);
            if (!isOwner && !isStaff && !canManage) {
                return interaction.reply({ content: "You must be the ticket owner or support to add users.", flags: MessageFlags.Ephemeral });
            }

            const raw = interaction.fields.getTextInputValue("ticket_add_user")?.trim() || "";
            const userId = raw.match(/\d{17,20}/)?.[0];
            if (!userId) {
                return interaction.reply({ content: "Invalid user. Provide a mention or ID.", flags: MessageFlags.Ephemeral });
            }

            const member = await interaction.guild.members.fetch(userId).catch(() => null);
            if (!member) {
                return interaction.reply({ content: "User not found in this server.", flags: MessageFlags.Ephemeral });
            }

            await channel.permissionOverwrites.edit(member.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            }, { reason: "Ticket add member" }).catch(() => {});

            return interaction.reply({ content: `Added <@${member.id}> to this ticket.`, flags: MessageFlags.Ephemeral });
        }

        // Close Ticket button -> lock, log, delete
        if (interaction.isButton() && interaction.customId === "ticket_close") {
            if (!interaction.inGuild()) return;

            const channel = interaction.channel;
            if (!channel?.parent || channel.parent.name.toLowerCase() !== DEFAULT_CATEGORY.toLowerCase()) {
                return interaction.reply({ content: "Use this inside a ticket channel.", flags: MessageFlags.Ephemeral });
            }

            const guild = interaction.guild;
            const ownerId = channel.topic?.match(/owner:(\d+)/)?.[1];
            const supportRole = getSupportRole(guild);
            const isOwner = ownerId && ownerId === interaction.user.id;
            const isStaff = supportRole && interaction.member.roles.cache.has(supportRole.id);
            const canManage = interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels);

            if (!isOwner && !isStaff && !canManage) {
                return interaction.reply({ content: "You must be the ticket owner or support to close this.", flags: MessageFlags.Ephemeral });
            }

            // Lock channel and post transcript
            await channel.permissionOverwrites.edit(guild.roles.everyone.id, { SendMessages: false, ViewChannel: false }).catch(() => {});
            const transcript = await createTranscript(channel);
            const log = getLogChannel(guild);

            if (log) {
                await log.send({
                    content: `Ticket closed: #${channel.name}\nOwner: <@${ownerId || "unknown"}>\nClosed by: <@${interaction.user.id}>`
                }).catch(() => {});
                await log.send(transcript).catch(() => {});
            } else {
                await channel.send(transcript).catch(() => {});
            }

            await interaction.reply({ content: "This ticket will be deleted in 10 seconds.", flags: MessageFlags.Ephemeral });
            await channel.send("Deleting this ticket in 10 seconds...").catch(() => {});
            setTimeout(() => channel.delete("Ticket closed").catch(() => {}), 10_000);
        }
    } catch (err) {
        console.error("interactionCreate (tickets) error:", err);
        if (interaction.isRepliable()) {
            try { await interaction.reply({ content: "Something went wrong.", flags: MessageFlags.Ephemeral }); } catch {}
        }
    }
};