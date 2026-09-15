const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const BUG_EGG_PETS = {
    snail: {
        name: "Snail",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/d2/Snail_Icon.png",
            fallback: "🐌"
        },
        type: "mollusk",
        rarity: "Legendary",
        source: "Bug Egg",
        probability: 40,
        obtainable: true,
        description: "Increases seed drop chances",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const chance = 5 + (kg / 20);
            
            const chanceMod = 5 * modifier;
            const chanceTotal = chance + chanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${chanceTotal.toFixed(2)}%</strong> extra chance harvested plants drop seeds. Rarer plants have lower chance to duplicate.${displayText}`;
        },
        perKgImpact: () => "Each additional kg adds 0.05% chance to drop seeds"
    },
    giantant: {
        name: "Giant Ant",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/0b/GiantAntIcon.png",
            fallback: "🐜"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Bug Egg",
        probability: 30,
        obtainable: true,
        description: "Duplicates harvested fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 5 + (kg / 10);
            const chanceMod = 5 * modifier;
            const totalChance = baseChance + chanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${totalChance.toFixed(1)}%</strong> chance harvested fruit duplicate!<br>Rarer crops have lower chance to duplicate${displayText}.`;
        },
        perKgImpact: () => "Each additional kg increases duplication chance by 0.1%"
    },
    caterpillar: {
        name: "Caterpillar",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/3d/Caterpillar_Icon.png",
            fallback: "🐛"
        },
        type: "insect",
        rarity: "Legendary",
        source: "Bug Egg",
        probability: 25,
        obtainable: true,
        description: "Accelerates growth of leafy plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const growthMultiplier = 1.45 + (kg * 0.15);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All leafy plants grow <strong>${growthMultiplier.toFixed(2)}x</strong> faster!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases leafy plant growth speed by 0.15x"
    },
    prayingmantis: {
        name: "Praying Mantis",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/25/PrayingMantis.png",
            fallback: "🦗"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Bug Egg",
        probability: 4,
        obtainable: true,
        description: "Prays to grant variant chance bonuses to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 80;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - kg);
            const duration = 10 + (kg / 10);
            const variantMultiplier = 1.5 + (kg / 200);
            const range = 10 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, prays for <strong>${Utils.formatTime(duration)}</strong> granting <strong>${variantMultiplier.toFixed(3)}x</strong> variant chance within <strong>${range.toFixed(1)}</strong> studs!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases prayer time by 1 second, increases prayer duration by 0.1 seconds, increases variant multiplier by 0.005x, and increases range by 0.1 studs"
    },
    dragonfly: {
        name: "Dragonfly",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/c/c9/DragonflyIcon.png",
            fallback: "🪲"
        },
        type: "insect",
        rarity: "Divine",
        source: "Bug Egg",
        probability: 1,
        obtainable: true,
        description: "Turns fruits into gold",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 300;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (3 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, turns one random fruit gold!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases gold transformation time by 3 seconds"
    }
};

module.exports = { BUG_EGG_PETS };
