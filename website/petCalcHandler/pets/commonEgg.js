const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const COMMON_EGG_PETS = {
    bunny: {
        name: "Bunny",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/6b/BunnyPet.png",
            fallback: "🐰"
        },
        type: "herbivore",
        rarity: "Common",
        source: "Common Egg",
        probability: 33.33,
        obtainable: true,
        description: "Eats carrots for value bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 45;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - kg);
            const bonus = 1.5 + (0.015 * kg);
            
            const bonusMod = 1.5 * modifier;
            const bonusTotal = bonus + bonusMod;
        
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, eats a carrot for a <strong>${bonusTotal.toFixed(3)}x</strong> value bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases feeding time by 1 second and increases value bonus by 0.015x"
    },
    dog: {
        name: "Dog",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/29/DogPet.png",
            fallback: "🐕"
        },
        type: "mammal",
        rarity: "Common",
        source: "Common Egg",
        probability: 33.33,
        obtainable: true,
        description: "Digs up random seeds",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - kg);
            const digChance = 5 + (kg / 20);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${digChance.toFixed(2)}%</strong> chance to dig up a random seed!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases digging time by 1 second and increases dig success chance by 0.05%"
    },
    goldenlab: {
        name: "Golden Lab",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/f3/GoldenLabPet.png",
            fallback: "🐕‍🦺"
        },
        type: "mammal",
        rarity: "Common",
        source: "Common Egg",
        probability: 33.33,
        obtainable: true,
        description: "Digs up random seeds with improved success rate",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - kg);
            const digChance = 10 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${digChance.toFixed(1)}%</strong> chance to dig up a random seed!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases digging time by 1 second and increases dig success chance by 0.1%"
    }
};

module.exports = { COMMON_EGG_PETS };
