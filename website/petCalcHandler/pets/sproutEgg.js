const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const sproutEggPets = {
    dairyCow: {
        name: "Dairy Cow",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/3f/DairyCow.png",
            fallback: "🐄"
        },
        type: "sprout",
        rarity: "Common",
        source: "Sprout Egg",
        probability: 50,
        obtainable: true,
        description: "All plants within range grow faster",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseRange = 10;
            const baseMultiplier = 1.25;
            const range = baseRange + (0.1 * kg);
            const multiplier = baseMultiplier + (0.0125 * kg);
            
            const rangeMod = baseRange * modifier;
            const multiplierMod = baseMultiplier * modifier;
            const rangeTotal = range + rangeMod;
            const multiplierTotal = multiplier + multiplierMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All plants within <strong>${rangeTotal.toFixed(1)}</strong> studs grow <strong>${multiplierTotal.toFixed(3)}x</strong> faster${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases range by 0.1 studs and growth multiplier by 0.0125x"
    },

    jackalope: {
        name: "Jackalope",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7f/Jackalope.png",
            fallback: "🐰"
        },
        type: "sprout",
        rarity: "Uncommon",
        source: "Sprout Egg",
        probability: 31,
        obtainable: true,
        description: "Thumps feet to apply Sandy mutation to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 100;
            const baseChance = 15;
            const cooldown = Math.max(50, baseCooldown - (0.25 * kg));
            const chance = baseChance + (0.25 * kg);
            
            const cooldownMod = baseCooldown * modifier;
            const chanceMod = baseChance * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(50, adjustedBaseCooldown - (0.25 * kg));
            const chanceTotal = chance + chanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${cooldownTotal.toFixed(1)}s</strong>, thumps its feet and has a <strong>${chanceTotal.toFixed(1)}%</strong> chance to mutate a nearby fruit, applying the Sandy mutation${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 0.25s (min 50s) and increases chance by 0.25%"
    },

    seedling: {
        name: "Seedling",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/6f/Seedling-Sapling.png",
            fallback: "🌱"
        },
        type: "sprout",
        rarity: "Legendary",
        source: "Sprout Egg",
        probability: 12,
        obtainable: true,
        description: "Swaps mutations between random fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 552;
            const cooldown = Math.min(300, baseCooldown - kg);
            
            const cooldownMod = baseCooldown * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.min(300, adjustedBaseCooldown - kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, swaps mutations between two different random fruits! Ignores favorited fruit${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1 second (max 5:00)"
    },

    golem: {
        name: "Golem",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/c/ce/Golem.png",
            fallback: "🗿"
        },
        type: "sprout",
        rarity: "Mythical",
        source: "Sprout Egg",
        probability: 6,
        obtainable: true,
        description: "Advances mutation machine time",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 400;
            const baseAmount = 40;
            const cooldown = Math.max(200, baseCooldown - kg);
            const amount = Math.min(80, baseAmount + (0.5 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const amountMod = baseAmount * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(200, adjustedBaseCooldown - kg);
            const amountTotal = Math.min(80, amount + amountMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong> goes to the mutation machine and tinkers with it and advances its time by <strong>${amountTotal.toFixed(1)}s</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1 second (min 3:20) and increases advance amount by 0.5s (max 80s)"
    },

    goldenGoose: {
        name: "Golden Goose",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/58/GoldenGoose.png",
            fallback: "🪿"
        },
        type: "sprout",
        rarity: "Divine",
        source: "Sprout Egg",
        probability: 1,
        obtainable: true,
        description: "Lays Golden Egg plants with Fortune mutation",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 788;
            const cooldown = Math.max(300, baseCooldown - (1.5 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(300, adjustedBaseCooldown - (1.5 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, lays a Golden Egg plant that starts with the Fortune mutation. It can be harvested and mutates like other plants. Selling it may apply Fortune mutation to a fruit in your garden${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases laying cooldown by 1.5 seconds (min 5:00)"
    }
};

module.exports = { SPROUT_EGG_PETS: sproutEggPets };
