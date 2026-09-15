const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const rareSummerEggPets = {
    flamingo: {
        name: "Flamingo",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/ec/FlamingoIcon.webp",
            fallback: "🦩"
        },
        type: "bird",
        rarity: "Rare",
        description: "Stands on one leg to boost nearby plant and fruit growth",
        source: "Rare Summer Egg",
        probability: 30,
        obtainable: true,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 240;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(15, adjustedBaseSeconds - (2 * kg));
            const duration = 15 + (kg / 2);
            const range = 13 + (0.3 * kg);
            const growthMultiplier = 15 + (kg / 4);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, stands on one leg for <strong>${Utils.formatTime(duration)}</strong>. All plants and fruits within <strong>${range.toFixed(1)}</strong> studs will grow <strong>${growthMultiplier.toFixed(1)}x</strong> faster!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases stance time by 2 seconds, increases stance duration by 0.5 seconds, increases range by 0.3 studs, and increases growth speed by 0.25x"
    },

    toucan: {
        name: "Toucan",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/10/ToucanIcon.webp",
            fallback: "🦜"
        },
        type: "bird",
        rarity: "Rare",
        description: "Provides size and variant bonuses to tropical plants",
        source: "Rare Summer Egg",
        probability: 25,
        obtainable: true,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const range = 25 + (kg / 4);
            const sizeBonus = 1.2 + (kg / 20);
            const variantBonus = 1.15 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Grants all tropical plants within <strong>${range.toFixed(1)}</strong> studs a <strong>${sizeBonus.toFixed(2)}x</strong> size bonus!\n\nGrants all tropical plants within <strong>${range.toFixed(1)}</strong> studs a <strong>${variantBonus.toFixed(2)}x</strong> variant chance bonus!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases range by 0.25 studs, increases size bonus by 0.05x, and increases variant bonus by 0.1x"
    },

    seaturtle: {
        name: "Sea Turtle",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/a/ad/SeaTurtleIcon.webp",
            fallback: "🐢"
        },
        type: "aquatic",
        rarity: "Rare",
        description: "Provides experience bonuses and water effects",
        source: "Rare Summer Egg",
        probability: 20,
        obtainable: true,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const expSeconds = Math.max(30, 720 - (6.5 * kg));
            const exp = 990 + (14 * kg);
            const splashSeconds = Math.max(30, 164 - (3 * kg));
            const wetChance = 12 + (0.2 * kg);
            
            const expMod = 990 * modifier;
            const wetChanceMod = 12 * modifier;
            const expTotal = exp + expMod;
            const wetChanceTotal = wetChance + wetChanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(expSeconds)}</strong>, grants <strong>${Utils.formatNumber(Math.round(expTotal))}</strong> bonus experience${displayText}!\n\nEvery <strong>${Utils.formatTime(splashSeconds)}</strong>, splashes water at a nearby fruit and it has a <strong>${wetChanceTotal.toFixed(2)}%</strong> chance to become Wet!`;
        },
        perKgImpact: () => "Each additional kg decreases experience time by 8 seconds, increases experience by 15, decreases splash time by 3 seconds, and increases wet chance by 0.2%"
    },

    seal: {
        name: "Seal",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/f9/SealIcon.webp",
            fallback: "🦭"
        },
        type: "aquatic",
        rarity: "Rare",
        description: "Provides chance to get pets back as eggs when selling",
        source: "Rare Summer Egg",
        probability: 10,
        obtainable: true,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);

            const baseReturn = 2.5;
            const returnMod = baseReturn * modifier;
            const adjustedBaseReturn = baseReturn + returnMod;
            const returnChance = Math.max(0, adjustedBaseReturn + (0.22 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Selling pets have a <strong>${returnChance.toFixed(2)}%</strong> chance to get the pet back as its egg equivalent!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases pet return chance by 0.22%"
    },

    orangutan: {
        name: "Orangutan",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/4/47/OrangutanIcon.webp",
            fallback: "🦧"
        },
        type: "mammal",
        rarity: "Rare",
        description: "Intelligent ape that uses tools to improve garden efficiency",
        source: "Rare Summer Egg",
        probability: 15,
        obtainable: true,
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 600;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (6 * kg));
            const toolEfficiency = 30 + (kg * 0.5);
            const intelligenceBonus = 25 + (kg * 0.4);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, uses tools intelligently! Improves garden efficiency by <strong>${toolEfficiency.toFixed(1)}%</strong> and provides <strong>${intelligenceBonus.toFixed(1)}%</strong> problem-solving bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases tool time by 6 seconds, increases efficiency by 0.5%, and increases intelligence bonus by 0.4%"
    }
};

module.exports = { RARE_SUMMER_EGG_PETS: rareSummerEggPets };
