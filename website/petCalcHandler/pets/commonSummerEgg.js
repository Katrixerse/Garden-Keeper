const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const commonSummerEggPets = {
    seagull: {
        name: "Seagull",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/59/SeagullIcon.webp",
            fallback: "🪶"
        },
        type: "bird",
        rarity: "Common",
        source: "Common Summer Egg",
        probability: 25,
        obtainable: true,
        description: "Increases seed drop chances for shoveling plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 3;
            const chance = baseChance + (0.3 * kg);
            
            const chanceMod = baseChance * modifier;
            const chanceTotal = chance + chanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Shoveling plants have a <strong>${chanceTotal.toFixed(1)}%</strong> chance to drop the equivalent seed! Does not work on fruit${displayText}.`;
        },
        perKgImpact: () => "Each additional kg increases seed drop chance by 0.3%"
    },

    starfish: {
        name: "Starfish",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/62/StarfishIcon.webp",
            fallback: "⭐"
        },
        type: "aquatic",
        rarity: "Common",
        source: "Common Summer Egg",
        probability: 50,
        obtainable: true,
        description: "Gains experience to grow older",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(1, adjustedBaseSeconds - (0.5 * kg));
            const exp = 25 + (3 * kg);
            
            const expMod = 25 * modifier;
            const expTotal = exp + expMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, grants <strong>${Utils.formatNumber(Math.round(expTotal))}</strong> experience!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases experience time by 0.5 seconds and increases experience by 3"
    },

    crab: {
        name: "Crab",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/b9/CrabIcon.webp",
            fallback: "🦀"
        },
        type: "aquatic",
        rarity: "Common",
        source: "Common Summer Egg",
        probability: 25,
        obtainable: true,
        description: "Steals money from other players",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 378;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(30, adjustedBaseSeconds - (4.0 * kg));
            const sheckles = 225 + (25 * kg);
            
            const shecklesMod = 225 * modifier;
            const shecklesTotal = sheckles + shecklesMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to another random player and pinches them for their money and grants you <strong>${Utils.formatNumber(Math.round(shecklesTotal))}</strong> sheckles${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases action time by 4.0 seconds and increases sheckles gained by 25"
    }
};

module.exports = { COMMON_SUMMER_EGG_PETS: commonSummerEggPets };
