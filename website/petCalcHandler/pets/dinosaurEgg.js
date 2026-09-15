const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const dinosaurEggPets = {
    raptor: {
        name: "Raptor",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/64/Raptor_Icon.png",
            fallback: "🦖"
        },
        type: "dinosaur",
        rarity: "Legendary",
        source: "Dinosaur Egg",
        probability: 35,
        obtainable: false,
        description: "Provides amber mutations and movement speed",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 2 + (kg / 5);
            const baseSpeed = 14 + (kg / 4);
            const chance = baseChance + (2 * modifier);
            const speed = baseSpeed + (14 * modifier);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${chance.toFixed(2)}%</strong> chance fruit gets Amber mutation after collecting.\nRarer plants have lesser chance.\n\nGrants additional <strong>${speed.toFixed(2)}%</strong> increase to player movement speed${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases amber mutation chance by 0.2% and movement speed by 0.25%"
    },

    stegosaurus: {
        name: "Stegosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/70/Stegosaurus_Icon.webp",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Legendary",
        source: "Dinosaur Egg",
        probability: 28,
        obtainable: false,
        description: "Duplicates harvested fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 8 + (0.15 * kg);
            const extraChance = 5 + (kg / 10);
            
            const baseChanceMod = 8 * modifier;
            const extraChanceMod = 5 * modifier;
            const baseChanceTotal = baseChance + baseChanceMod;
            const extraChanceTotal = extraChance + extraChanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${baseChanceTotal.toFixed(2)}%</strong> chance harvested fruit duplicates!\nRarer crops have lower chance to duplicate.\n\n<strong>${extraChanceTotal.toFixed(2)}%</strong> extra chance for Prehistoric type fruit to duplicate${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases duplication chance by 0.15% and prehistoric fruit bonus by 0.1%"
    },

    trex: {
        name: "T-Rex",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/5/5e/T-Rex_Icon.webp",
            fallback: "🦖"
        },
        type: "dinosaur",
        rarity: "Divine",
        source: "Dinosaur Egg",
        probability: 0.5,
        obtainable: false,
        description: "Devours and spreads mutations throughout the garden",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1224;
            const baseTargets = 3;
            const targets = baseTargets + (kg / 5);
            
            const secondsMod = baseSeconds * modifier;
            const targetsMod = baseTargets * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const finalSeconds = Math.max(15, adjustedBaseSeconds - (12 * kg));
            const targetsTotal = targets + targetsMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(finalSeconds)}</strong>, devours a random mutation from your garden, then spreads it to <strong>${targetsTotal.toFixed(1)}</strong> other random fruits in your garden${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases action time by 12 seconds and increases spread targets by 0.2"
    },

    brontosaurus: {
        name: "Brontosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2f/Brontosaurus_Icon.webp",
            fallback: "🦴"
        },
        type: "dinosaur",
        rarity: "Mythical",
        source: "Dinosaur Egg",
        probability: 1,
        obtainable: false,
        description: "Increases size and weight of pets hatched from eggs",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseBonus = 5.25;
            const bonus = Math.min(30, baseBonus + (kg / 10));
            
            const bonusMod = baseBonus * modifier;
            const adjustedBaseBonus = Math.min(30, baseBonus + bonusMod);
            const bonusTotal = Math.min(30, adjustedBaseBonus + (kg / 10));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Pets hatched from eggs have a <strong>${bonusTotal.toFixed(2)}%</strong> increase in base size and weight! (Max bonus 30%, does not apply to Brontosauruses.)${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases size and weight bonus by 0.1% (capped at 30% total)"
    },

    pterodactyl: {
        name: "Pterodactyl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7c/Pterodactyl_Icon.webp",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Mythical",
        source: "Dinosaur Egg",
        probability: 3,
        obtainable: false,
        description: "Flaps wings to send ripples causing fruit to get Windstruck with chance for Twisted",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 666;
            const baseFruits = 3;
            const baseTwistedChance = 18.2;
            const baseJumpBonus = 14;
            const fruits = baseFruits + (0.15 * kg);
            const twistedChance = baseTwistedChance + (kg / 4);
            const jumpBonus = baseJumpBonus + (kg / 4);
            
            const secondsMod = baseSeconds * modifier;
            const fruitsMod = baseFruits * modifier;
            const twistedChanceMod = baseTwistedChance * modifier;
            const jumpBonusMod = baseJumpBonus * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const finalSeconds = Math.max(33, adjustedBaseSeconds - (6 * kg));
            const fruitsTotal = fruits + fruitsMod;
            const twistedChanceTotal = twistedChance + twistedChanceMod;
            const jumpBonusTotal = jumpBonus + jumpBonusMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(finalSeconds)}</strong>, flaps its wings and sends out ripples of wind causing <strong>${fruitsTotal.toFixed(2)}</strong> random fruit to get Windstruck with a <strong>${twistedChanceTotal.toFixed(2)}%</strong> chance for Twisted to be applied as well!\n\nGrants additional <strong>${jumpBonusTotal.toFixed(2)}%</strong> increase to player jump height${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases flapping time by 6 seconds, increases fruit affected by 0.15, increases Twisted chance by 0.25%, and increases jump height by 0.25%"
    },

    triceratops: {
        name: "Triceratops",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/a/a1/Triceratops.png",
            fallback: "🦎"
        },
        type: "dinosaur",
        rarity: "Legendary",
        source: "Dinosaur Egg",
        probability: 32.5,
        obtainable: false,
        description: "Rams into plans to advance their growth",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 15;
            const chanceMod = baseChance * modifier;
            const totalChance = baseChance + chanceMod + (0.15 * kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>3:33</strong>, rams into 3 random plants and advance their growth by 33:33! Has a <strong>${totalChance.toFixed(1)}%</strong> chance to do it again each time.${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases preservation chance by 0.20%"
    }
};

module.exports = { DINOSAUR_EGG_PETS: dinosaurEggPets };
