const { EmbedBuilder } = require("discord.js");
const request = require("node-superfetch");
const ms = require("ms");

let SeedStock = "";
let EggStock = "";
let GearStock = "";

async function fetchStock(body) {
    for (let i in body.seed_stock) {
        SeedStock += body.seed_stock[i].display_name + " x" + body.seed_stock[i].quantity + "\n";
    }

    for (let i in body.egg_stock) {
        EggStock += body.egg_stock[i].display_name + " x" + body.egg_stock[i].quantity + "\n";
    }

    for (let i in body.gear_stock) {
        GearStock += body.gear_stock[i].display_name + " x" + body.gear_stock[i].quantity + "\n";
    }
}

module.exports = {
    name: 'stock',
    aliases: ["stock"],
    description: 'Checks Grow a Garden stocks',
    usage: 'g!stock',
    cooldownTime: '1',
    group: 'info',
    botPermissions: ['none'],
    run: async (bot, prefix, message, args) => {

        const { body } = await request
            .get('https://api.joshlei.com/v2/growagarden/stock')

        await fetchStock(body);

        const stockEmbed = new EmbedBuilder()
            .setAuthor({ name: `Grow a Garden Stock`, iconURL: bot.user.avatarURL() })
            .addFields([
                { name: "Seed Stock:", value: SeedStock, inline: true },
            ])
            .addFields([
                { name: "Egg Stock:", value: EggStock, inline: true },
            ])
            .addFields([
                { name: "Gear Stock:", value: GearStock, inline: false },
            ])
            .setTimestamp()
            .setColor(`#F49A32`);
        message.channel.send({ embeds: [stockEmbed] });
        SeedStock = ""; // Reset SeedStock for next use
        EggStock = ""; // Reset EggStock for next use
        GearStock = ""; // Reset GearStock for next use
    }
};