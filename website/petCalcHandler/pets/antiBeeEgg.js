const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const ANTI_BEE_EGG_PETS = {
    wasp: {
        name: "Wasp",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/f8/The_Wasp.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Rare",
        source: "Anti Bee Egg",
        probability: 55,
        obtainable: true,
        description: "Pollinates fruits and stings pets to advance cooldowns",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const basePollinateSeconds = 1800;
            const pollinateSecondsMod = basePollinateSeconds * modifier;
            const adjustedBasePollinateSeconds = basePollinateSeconds + pollinateSecondsMod;
            const pollinateSeconds = Math.max(60, adjustedBasePollinateSeconds - (18 * kg));
            
            const baseStingSeconds = 602;
            const stingSecondsMod = baseStingSeconds * modifier;
            const adjustedBaseStingSeconds = baseStingSeconds + stingSecondsMod;
            const stingSeconds = Math.max(60, adjustedBaseStingSeconds - (6 * kg));
            const cooldownAdvance = 60 + (0.6 * kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(pollinateSeconds)}</strong>, flies to a nearby fruit and pollinates it applying Pollinated mutation!\n\nEvery <strong>${Utils.formatTime(stingSeconds)}</strong>, stings a random pet and advances its ability cooldown by <strong>${Utils.formatTime(cooldownAdvance)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 18 seconds, decreases sting time by 6 seconds, and increases cooldown advance by 0.6 seconds"
    },
    tarantulahawk: {
        name: "Tarantula Hawk",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/78/The_Tarantula_Hawk.png",
            fallback: "🕷️"
        },
        type: "insect",
        rarity: "Legendary",
        source: "Anti Bee Egg",
        probability: 30,
        obtainable: true,
        description: "Pollinates fruits and stings pets to advance cooldowns",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const basePollinateSeconds = 1510;
            const pollinateSecondsMod = basePollinateSeconds * modifier;
            const adjustedBasePollinateSeconds = basePollinateSeconds + pollinateSecondsMod;
            const pollinateSeconds = Math.max(150, adjustedBasePollinateSeconds - (16 * kg));
            
            const baseStingSeconds = 302;
            const stingSecondsMod = baseStingSeconds * modifier;
            const adjustedBaseStingSeconds = baseStingSeconds + stingSecondsMod;
            const stingSeconds = Math.max(150, adjustedBaseStingSeconds - (3 * kg));
            const cooldownAdvance = 80 + (0.8 * kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(pollinateSeconds)}</strong>, flies to a nearby fruit and pollinates it applying Pollinated mutation!\n\nEvery <strong>${Utils.formatTime(stingSeconds)}</strong>, stings a random pet and advances its ability cooldown by <strong>${Utils.formatTime(cooldownAdvance)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds, decreases sting time by 3 seconds, and increases cooldown advance by 0.8 seconds"
    },
    moth: {
        name: "Moth",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/09/Moth.png",
            fallback: "🦋"
        },
        type: "insect",
        rarity: "Legendary",
        source: "Anti Bee Egg",
        probability: 13.75,
        obtainable: true,
        description: "Sings to restore pet hunger",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 763;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(70, adjustedBaseSeconds - (7 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, sings to a random pet and restores its hunger to 100%!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases singing time by 7 seconds"
    },
    butterfly: {
        name: "Butterfly",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/18/Thy_Butterfly_V2.png",
            fallback: "🦋"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Anti Bee Egg",
        probability: 1,
        obtainable: true,
        description: "Transforms heavily mutated fruits into rainbow fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1807.4;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(180, adjustedBaseSeconds - (18 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit with 5+ mutations, removes all of them, and turns it rainbow!\nIgnores favorited fruit${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases transformation time by 18 seconds"
    },
    discobee: {
        name: "Disco Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/f2/DiscoBeeIcon.gif",
            fallback: "🕺"
        },
        type: "insect",
        rarity: "Divine",
        source: "Anti Bee Egg",
        probability: 0.25,
        obtainable: true,
        description: "Pollinates fruits and boosts nearby plant growth",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1610;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (16 * kg));
            const growthMultiplier = 1.55 + (kg * 0.01);
            const range = 10 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it, applying Pollinated mutation!\n\nNearby plants within <strong>${range.toFixed(1)}</strong> studs grow <strong>${growthMultiplier.toFixed(2)}x</strong> faster!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds, increases growth multiplier by 0.01x, and increases range by 0.1 studs"
    }
};

module.exports = { ANTI_BEE_EGG_PETS };
