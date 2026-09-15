const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const BEE_EGG_PETS = {
    bee: {
        name: "Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/f2/Beee.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Uncommon",
        source: "Bee Egg",
        probability: 65,
        obtainable: true,
        description: "Pollinates fruits with mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1800;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(150, adjustedBaseSeconds - (18 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it, applying Pollinated mutation!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 18 seconds"
    },
    honeybee: {
        name: "Honey Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/14/HoneyBee.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Rare",
        source: "Bee Egg",
        probability: 25,
        obtainable: true,
        description: "Pollinates fruits with mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1210;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (12 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it, applying Pollinated mutation!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 12 seconds"
    },
    bearbee: {
        name: "Bear Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/8/8b/Bearbeee1.png",
            fallback: "🐻"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Bee Egg",
        probability: 5,
        obtainable: true,
        description: "Attempts to pollinate but creates Honey Glazed fruits instead",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1510;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const finalSeconds = Math.max(60, adjustedBaseSeconds - (16 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(finalSeconds)}</strong>, goes to a nearby fruit and tries to pollinate it - but it's not a bee so it fails and turns it to Honey Glazed instead${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases honey glazing time by 16 seconds"
    },
    petalbee: {
        name: "Petal Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/52/Petalbee.png",
            fallback: "🌸"
        },
        type: "insect",
        rarity: "Legendary",
        source: "Bee Egg",
        probability: 4,
        obtainable: true,
        description: "Pollinates fruits and preserves Flower type fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const seconds = Math.max(150, 1510 - (16 * kg));
            const flowerChance = 1 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it applying Pollinated mutation!\n\n<strong>${flowerChance.toFixed(1)}%</strong> chance Flower type fruit stays after harvest!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds and increases flower preservation chance by 0.1%"
    },
    queenbee: {
        name: "Queen Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7a/Queen_bee.png",
            fallback: "👑"
        },
        type: "insect",
        rarity: "Divine",
        source: "Bee Egg",
        probability: 1,
        obtainable: true,
        description: "Pollinates fruits and refreshes pet abilities",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const basePollinateSeconds = 1220;
            const pollinateSecondsMod = basePollinateSeconds *  modifier;
            const adjustedBasePollinateSeconds = basePollinateSeconds - pollinateSecondsMod;
            const pollinateSeconds = Math.max(60, adjustedBasePollinateSeconds - (16 * kg));
            
            const baseRefreshSeconds = 1328;
            const refreshSecondsMod = baseRefreshSeconds * modifier;
            const adjustedBaseRefreshSeconds = baseRefreshSeconds - refreshSecondsMod;
            const refreshSeconds = Math.max(60, adjustedBaseRefreshSeconds - (16 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(pollinateSeconds)}</strong>, a nearby fruit gets magically pollinated applying Pollinated mutation!\n\nEvery <strong>${Utils.formatTime(refreshSeconds)}</strong>, the pet with the highest cooldown refreshes its ability!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds and refresh time by 16 seconds"
    }
};

module.exports = { BEE_EGG_PETS };
