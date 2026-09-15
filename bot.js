const { Client, Collection, GatewayIntentBits, Partials, Options, EmbedBuilder, codeBlock, ShardEvents } = require('discord.js');
const { botToken, errorLogChannel } = require('./config.json');
const { conn } = require("./bot/Handlers/dbHandlers/dbConnection.js");

const HandleEvents = require("./bot/Handlers/EventHandler.js");
const HandleCommands = require('./bot/Handlers/commandHandler.js');
const { setupSlashCommands } = require('./bot/Handlers/SlashHandler.js');
const { setupGiveawayScheduler } = require('./bot/Handlers/giveawayHandlers/GiveawayScheduler.js');

const MAIN_GUILD_ID = "1392233149630648533";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildWebhooks
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.User,
        Partials.Reaction,
        Partials.Message
    ],
    allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    makeCache: Options.cacheWithLimits({ ...Options.defaultMakeCacheSettings })
});

// Initialize collections for commands and metadata
['commands', 'aliases', 'description', 'usage', 'cooldownTime', 'group', 'botPermissions'].forEach(x => client[x] = new Collection());

// Load commands and events
HandleEvents(client);
HandleCommands(client);

// Setup application commands (slash commands) and setup giveaway scheduler
setupSlashCommands(client);
setupGiveawayScheduler(client);

/**
 * Helper to send an embed to the log channel.
 */
async function sendLogEmbed(embed) {
    try {
        const guild = client.guilds.cache.get(errorLogChannel);
        if (!guild) return console.warn('Log guild not found');
        const channel = guild.channels.cache.get(logChannel);
        if (!channel) return console.warn('Log channel not found');
        await channel.send({ embeds: [embed] });
    } catch (err) {
        console.error('Error sending to logs channel:', err);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);

    const errorMsg = error && error.toString().length > 950 ? error.toString().slice(0, 950) + '... view console for details' : error?.toString() || "No error";
    const stackMsg = error?.stack && error.stack.length > 950 ? error.stack.slice(0, 950) + '... view console for details' : error?.stack || "No stack error";

    const embed = new EmbedBuilder()
        .setTitle('🚨・Unhandled promise rejection')
        .addFields([
            { name: "Error", value: codeBlock(errorMsg) },
            { name: "Stack error", value: codeBlock(stackMsg) }
        ])
        .setColor('Green');

    sendLogEmbed(embed);
});

// Handle process warnings
process.on('warning', warn => {
    console.warn("Warning:", warn);

    const embed = new EmbedBuilder()
        .setTitle('🚨・New warning found')
        .addFields([
            { name: "Warn", value: codeBlock(warn.toString()) }
        ])
        .setColor("Green");

    sendLogEmbed(embed);
});

// Handle shard errors
client.on(ShardEvents.Error, error => {
    console.error('Shard error:', error);

    const errorMsg = error && error.toString().length > 950 ? error.toString().slice(0, 950) + '... view console for details' : error?.toString() || "No error";
    const stackMsg = error?.stack && error.stack.length > 950 ? error.stack.slice(0, 950) + '... view console for details' : error?.stack || "No stack error";

    const embed = new EmbedBuilder()
        .setTitle('🚨・A websocket connection encountered an error')
        .addFields([
            { name: "Error", value: codeBlock(errorMsg) },
            { name: "Stack error", value: codeBlock(stackMsg) }
        ])
        .setColor("Green");

    sendLogEmbed(embed);
});

if(!botToken){
    console.error('bot token not set config file.');
    process.exit(1);
}

client.login(botToken);
