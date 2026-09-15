const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const PARADISE_EGG_PETS = {
    ostrich: {
        name: "Ostrich",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/8/82/OstrichIcon.webp",
            fallback: "🦓"
        },
        type: "bird",
        rarity: "Legendary",
        source: "Paradise Egg",
        probability: 40,
        obtainable: true,
        description: "Provides age bonuses to hatched pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const maxAge = 4.5 + (kg / 2);
            
            const maxAgeMod = 4.5 * modifier;
            const maxAgeTotal = Math.min(10, maxAge + maxAgeMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Pets hatched from eggs have a bonus <strong>1 to ${maxAgeTotal.toFixed(1)}</strong> age to their age value${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases maximum bonus age by 0.5"
    },
    peacock: {
        name: "Peacock",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/61/Peacock.png",
            fallback: "🦚"
        },
        type: "bird",
        rarity: "Legendary",
        source: "Paradise Egg",
        probability: 30,
        obtainable: true,
        description: "Fans feathers to advance nearby pets' cooldowns",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 606;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (6 * kg));
            const range = 20 + (kg / 5);
            const cooldownAdvance = 65 + (0.6 * kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, fans its feathers and all active pets within <strong>${range.toFixed(1)}</strong> studs will advance cooldown for their abilities by <strong>${Utils.formatTime(cooldownAdvance)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases feather time by 6 seconds, increases range by 0.2 studs, and increases cooldown advance by 0.6 seconds"
    },
    capybara: {
        name: "Capybara",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/12/CapybaraIIcon.webp",
            fallback: "🦫"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Paradise Egg",
        probability: 21,
        obtainable: true,
        description: "Provides area buffs to nearby pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const studs = 14.5 + (kg / 4);
            const xp = 3 + (0.3 * kg);
            
            const studsMod = 15.5 * modifier;
            const xpMod = 3 * modifier;
            const studsTotal = studs + studsMod;
            const xpTotal = Math.min(30, xp + xpMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All pets within <strong>${studsTotal.toFixed(1)}</strong> studs won't lose hunger and will gain <strong>${xpTotal.toFixed(1)}</strong> XP every second${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases buff range by 0.25 studs and XP gain by 0.3"
    },
    scarletmacaw: {
        name: "Scarlet Macaw",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/21/ScarletMacawIcon.webp",
            fallback: "🦜"
        },
        type: "bird",
        rarity: "Legendary",
        source: "Paradise Egg",
        probability: 8,
        obtainable: true,
        description: "Applies Verdant mutations to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 524;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(50, adjustedBaseSeconds - (5 * kg));
            const mutateChance = 15 + (kg / 2);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${mutateChance.toFixed(1)}%</strong> chance to mutate a nearby fruit applying the Verdant mutation!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases mutation time by 5 seconds and increases mutation chance by 0.5%"
    },
    mimicoctopus: {
        name: "Mimic Octopus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/00/MimicOctopusIcon.webp",
            fallback: "🐙"
        },
        type: "aquatic",
        rarity: "Mythical",
        source: "Paradise Egg",
        probability: 1,
        obtainable: true,
        description: "Mimics and copies abilities from other pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1212;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(15, adjustedBaseSeconds - (12 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, mimics and copies an ability from another pet and performs its ability!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases mimicking time by 12 seconds"
    }
};

module.exports = { PARADISE_EGG_PETS };
