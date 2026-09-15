let ICONS = {}; let TYPES = {}; let RARITIES = {}; try { ({ ICONS } = require('../data/icons.js')); ({ TYPES, RARITIES } = require('../data/constants.js')); } catch {}
const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const GOURMET_EGG_PETS = {
    bagelbunny: {
        name: "Bagel Bunny",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/51/BagelBunny.png",
            fallback: "🥯"
        },
        type: "herbivore",
        rarity: "Legendary",
        source: "Gourmet Egg",
        probability: 50,
        obtainable: true,
        description: "Eats carrots for enhanced value bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 45;
            const cooldownMod = baseCooldown * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(5, adjustedBaseCooldown - kg);
            const multiplier = 5 + (0.05 * kg);
            
            const multiplierMod = 5 * modifier;
            const multiplierTotal = multiplier + multiplierMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldown)}</strong>, eats a carrot for <strong>${multiplierTotal.toFixed(2)}x</strong> value bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1 second and increases value bonus by 0.05x"
    },

    pancakemole: {
        name: "Pancake Mole",
        icon: ICONS.PANCAKEMOLE,
        type: TYPES.SPECIALTY,
        rarity: RARITIES.UNCOMMON,
        source: "Gourmet Egg",
        probability: 38,
        obtainable: true,
        description: "Flat mole that loves pancakes and provides breakfast bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 420;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(10, adjustedBaseSeconds - (4.5 * kg));
            const breakfastBonus = 28 + (kg * 0.45);
            const fluffiness = 22 + (kg * 0.35);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flips pancakes! Provides <strong>${breakfastBonus.toFixed(1)}%</strong> breakfast bonus and <strong>${fluffiness.toFixed(1)}%</strong> fluffy comfort enhancement${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases flip time by 4.5 seconds, increases breakfast bonus by 0.45%, and increases fluffiness by 0.35%"
    },

    sushibear: {
        name: "Sushi Bear",
        icon: ICONS.SUSHIBEAR,
        type: TYPES.SPECIALTY,
        rarity: RARITIES.RARE,
        source: "Gourmet Egg",
        probability: 7,
        obtainable: true,
        description: "Cultured bear that appreciates fine sushi and provides gourmet bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 600;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (6 * kg));
            const gourmetBonus = 30 + (kg * 0.5);
            const sushiCraftsmanship = 25 + (kg * 0.4);
            const refinement = 20 + (kg * 0.35);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, crafts fine sushi! Provides <strong>${gourmetBonus.toFixed(1)}%</strong> gourmet bonus, <strong>${sushiCraftsmanship.toFixed(1)}%</strong> culinary craftsmanship, and <strong>${refinement.toFixed(1)}%</strong> cultural refinement${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases crafting time by 6 seconds, increases gourmet bonus by 0.5%, craftsmanship by 0.4%, and refinement by 0.35%"
    },

    spaghettisloth: {
        name: "Spaghetti Sloth",
        icon: ICONS.SPAGHETTISLOTH,
        type: TYPES.SPECIALTY,
        rarity: RARITIES.EPIC,
        source: "Gourmet Egg",
        probability: 4,
        obtainable: true,
        description: "Slow-moving sloth that loves pasta and provides relaxation bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 900;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(200, adjustedBaseSeconds - (8 * kg));
            const relaxation = 35 + (kg * 0.6);
            const pastaJoy = 25 + (kg * 0.4);
            const slowness = 40 + (kg * 0.7);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, slowly enjoys spaghetti! Provides <strong>${relaxation.toFixed(1)}%</strong> deep relaxation, <strong>${pastaJoy.toFixed(1)}%</strong> culinary joy, and <strong>${slowness.toFixed(1)}%</strong> mindful slowness bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases eating time by 8 seconds, increases relaxation by 0.6%, pasta joy by 0.4%, and slowness bonus by 0.7%"
    },

    frenchfryferret: {
        name: "French Fry Ferret",
        icon: ICONS.FRENCHFRYFERRET,
        type: TYPES.SPECIALTY,
        rarity: RARITIES.EPIC,
        source: "Gourmet Egg",
        probability: 1,
        obtainable: true,
        description: "Increases pet levels",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 3632;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(1200, adjustedBaseSeconds - (36 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, increases a random pet's level by 1! Ability cannot be mimicked or refreshed${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 36 seconds"
    }
};

module.exports = { GOURMET_EGG_PETS };
