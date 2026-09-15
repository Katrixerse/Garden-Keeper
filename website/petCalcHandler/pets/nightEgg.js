const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const NIGHT_EGG_PETS = {
    raccoon: {
        name: "Raccoon",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7c/Raccoon.png",
            fallback: "🦝"
        },
        type: "mammal",
        rarity: "Divine",
        source: "Night Egg",
        probability: 0.12,
        obtainable: false,
        description: "Steals and duplicates crops from other plots",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 904;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(15, adjustedBaseSeconds - (4 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to another plot and duplicates a random crop and gives it to you${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases stealing time by 4 seconds"
    },
    hedgehog: {
        name: "Hedgehog",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/4/46/HedgehogPet.png",
            fallback: "🦔"
        },
        type: "mammal",
        rarity: "Rare",
        source: "Night Egg",
        probability: 47,
        obtainable: false,
        description: "Provides size bonuses to prickly plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const range = 2.5 + (kg / 4);
            const bonus = 0.20 + (kg / 50);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Grants all prickly plants within <strong>${range.toFixed(1)}</strong> studs a <strong>${bonus.toFixed(2)}x</strong> size bonus!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases range by 0.25 studs and increases size bonus by 0.02x"
    },
    mole: {
        name: "Mole",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/63/Mole.png",
            fallback: "🦔"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Night Egg",
        probability: 23.50,
        obtainable: false,
        description: "Digs underground to find treasure",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 10;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(10, adjustedBaseSeconds - (1 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, digs down underground to find treasure. Can dig up gear or sheckles!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases digging time by 1 second (minimum 10 seconds)"
    },
    nightowl: {
        name: "Night Owl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/07/Night_Owl_Icon.png",
            fallback: "🦉"
        },
        type: "bird",
        rarity: "Mythical",
        source: "Night Egg",
        probability: 3.53,
        obtainable: false,
        description: "Provides XP bonuses to all active pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const xpBonus = 0.2 + (kg / 25);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All active pets gain an additional <strong>${xpBonus.toFixed(2)} XP/s</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases all pets' XP bonus by 0.04 XP/s"
    },
    echofrog: {
        name: "Echo Frog",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/30/Echo_frog.png",
            fallback: "🐸"
        },
        type: "amphibian",
        rarity: "Mythical",
        source: "Night Egg",
        probability: 8.23,
        obtainable: false,
        description: "Croaks to advance plant growth by 24 hours",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 303;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(30, adjustedBaseSeconds - (6 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, croaks and a random nearby plant will advance growth by <strong>24 hours</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases croaking time by 6 seconds"
    },
    frog: {
        name: "Frog",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/55/FrogV2.png",
            fallback: "🐸"
        },
        type: "amphibian",
        rarity: "Legendary",
        source: "Night Egg",
        probability: 17.63,
        obtainable: false,
        description: "Croaks to advance plant growth by 24 hours",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 604.5;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (9 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, croaks and a random nearby plant will advance growth by <strong>24 hours</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases croaking time by 9 seconds"
    }
};

module.exports = { NIGHT_EGG_PETS };
