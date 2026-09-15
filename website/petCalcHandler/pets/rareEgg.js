const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');
let ICONS = {}; let RARITIES = {}; let TYPES = {}; try { ({ ICONS } = require('../data/icons.js')); ({ RARITIES, TYPES } = require('../data/constants.js')); } catch {}

const rareEggPets = {
    orangetabby: {
        name: "Orange Tabby",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/73/Orange_tabby_icon.png",
            fallback: "🐱"
        },
        type: "mammal",
        rarity: "Rare",
        description: "Naps to provide size bonuses to nearby fruits",
        source: "Rare Egg",
        probability: 33.33,
        obtainable: false,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseNapInterval = 90;
            const napIntervalMod = baseNapInterval * modifier;
            const adjustedBaseNapInterval = baseNapInterval - napIntervalMod;
            const napInterval = Math.max(5, adjustedBaseNapInterval - kg);
            const napDuration = 15 + (0.15 * kg);
            const range = 15 + (0.15 * kg);
            const sizeMultiplier = 1.5 + (kg / 100);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(napInterval)}</strong>, naps for <strong>${Utils.formatTime(napDuration)}</strong>. New fruit within <strong>${range.toFixed(2)}</strong> studs will be <strong>${sizeMultiplier.toFixed(3)}x</strong> larger!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases nap interval by 1 second, increases nap duration by 0.15 seconds, increases range by 0.15 studs, and increases size multiplier by 0.01x"
    },

    spotteddeer: {
        name: "Spotted Deer",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/38/Spotteddeer.png",
            fallback: "🦌"
        },
        type: "mammal",
        rarity: "Rare",
        description: "Preserves berry fruits after harvest",
        source: "Rare Egg",
        probability: 25,
        obtainable: false,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const preserveChance = Math.min(10, 5 + (kg / 20));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${preserveChance.toFixed(2)}%</strong> chance berry fruit stays after harvest!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases berry preservation chance by 0.05%"
    },

    pig: {
        name: "Pig",
        icon: ICONS.PIG,
        type: "domestic",
        rarity: "Common",
        description: "Snorts around finding truffles and valuable items",
        source: "Rare Egg",
        probability: 16.67,
        obtainable: false,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 200;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - (2.5 * kg));
            const findChance = 6 + (kg * 0.1);
            const truffleValue = 12 + (kg * 0.2);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, snorts for truffles! <strong>${findChance.toFixed(2)}%</strong> chance to find <strong>${truffleValue.toFixed(1)}</strong> value items${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases snort time by 2.5 seconds, increases find chance by 0.1%, and increases truffle value by 0.2"
    },

    rooster: {
        name: "Rooster",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2c/Rooster.png",
            fallback: "🐓"
        },
        type: "bird",
        rarity: "Rare",
        description: "Increases egg hatch speed",
        source: "Rare Egg",
        probability: 16.67,
        obtainable: false,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const speed = 20 + (kg / 5);
            
            const speedMod = 20 * modifier;
            const speedTotal = speed + speedMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Increases egg hatch speed by <strong>${speedTotal.toFixed(2)}%</strong>${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases egg hatch speed by 0.2%"
    },

    monkey: {
        name: "Monkey",
        icon: ICONS.MONKEY,
        type: "mammal",
        rarity: "Uncommon",
        description: "Playful primate that swings around gathering fruits",
        source: "Rare Egg",
        probability: 8.33,
        obtainable: false,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 120;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(12, adjustedBaseSeconds - (2 * kg));
            const gatherAmount = 6 + (kg * 0.12);
            const swingBonus = 15 + (kg * 0.2);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, swings around gathering! Collects <strong>${gatherAmount.toFixed(2)}</strong> fruits with <strong>${swingBonus.toFixed(1)}%</strong> acrobatic bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases swing time by 2 seconds, increases gathering by 0.12, and increases acrobatic bonus by 0.2%"
    }
};

module.exports = { RARE_EGG_PETS: rareEggPets };
