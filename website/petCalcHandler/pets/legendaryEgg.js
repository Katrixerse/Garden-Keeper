let ICONS = {}; try { ({ ICONS } = require('../data/icons.js')); } catch {}
const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const LEGENDARY_EGG_PETS = {
    cow: {
        name: "Cow",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/8/84/Cow.png",
            fallback: "🐄"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Legendary Egg",
        probability: 42.55,
        obtainable: false,
        description: "Provides growth bonuses to nearby plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const range = 10 + (kg / 10);
            const growthMultiplier = 1.25 + (kg / 80);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All plants within <strong>${range.toFixed(1)}</strong> studs grow <strong>${growthMultiplier.toFixed(3)}x</strong> faster!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases buff range by 0.1 studs and growth speed by 0.0125x"
    },

    silvermonkey: {
        name: "Silver Monkey",
        icon: ICONS.SILVERMONKEY,
        type: "mammal",
        rarity: "Epic",
        source: "Legendary Egg",
        probability: 42.55,
        obtainable: false,
        description: "Mystical monkey with silver fur that reflects moonlight for magical bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 480;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(1, adjustedBaseSeconds - (5 * kg));
            const xpMultiplier = 1.15 + (kg / 100);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, shines silver light on all pets for 10 seconds, granting them <strong>${xpMultiplier.toFixed(2)}x</strong> XP gain!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases shine time by 5 seconds and increases XP multiplier by 0.01x"
    },

    seaotter: {
        name: "Sea Otter",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/c/c3/Sea_Otter.png",
            fallback: "🦦"
        },
        type: "aquatic",
        rarity: "Legendary",
        source: "Legendary Egg",
        probability: 10.64,
        obtainable: false,
        description: "Sprays water on nearby plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 240;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(5, adjustedBaseSeconds - (2.4 * kg));
            const range = 6 + (kg / 10);
            const waterEffect = 1.1 + (kg / 200);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, sprays water on all plants within <strong>${range.toFixed(1)}</strong> studs, increasing their growth by <strong>${waterEffect.toFixed(2)}x</strong> for 15 seconds!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases spray time by 2.4 seconds, increases range by 0.1 studs, and increases growth boost by 0.005x"
    },

    polarbear: {
        name: "Polar Bear",
        icon: ICONS.POLARBEAR,
        type: "mammal",
        rarity: "Epic",
        source: "Legendary Egg",
        probability: 2.13,
        obtainable: false,
        description: "Arctic bear that provides ice and cold resistance bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 600;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(10, adjustedBaseSeconds - (6 * kg));
            const coldResistance = 25 + (kg / 4);
            const freezeImmunity = Math.min(100, 50 + (kg / 2));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, roars and grants all plants <strong>${coldResistance.toFixed(1)}%</strong> cold resistance and <strong>${freezeImmunity.toFixed(1)}%</strong> freeze immunity for 30 seconds!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases roar time by 6 seconds, increases cold resistance by 0.25%, and increases freeze immunity by 0.5%"
    },

    turtle: {
        name: "Turtle",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/b1/Turtle_icon.png",
            fallback: "🐢"
        },
        type: "reptile",
        rarity: "Legendary",
        source: "Legendary Egg",
        probability: 2.13,
        obtainable: false,
        description: "Extends sprinkler duration",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const duration = 20 + (kg / 5);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All Sprinklers last <strong>${duration.toFixed(1)}%</strong> longer!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases sprinkler duration by 0.2%"
    }
};

module.exports = { LEGENDARY_EGG_PETS };
