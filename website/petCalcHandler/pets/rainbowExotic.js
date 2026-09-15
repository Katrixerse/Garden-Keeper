const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const rainbowExoticPets = {
    rainbowParasaurolophus: {
        name: "Rainbow Parasaurolophus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/9/9f/RainbowParasaurolophus.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Reduces cosmetic crate open times with chance for multiplied effect",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 41;
            const baseAmount = 160;
            const baseChance = 51;
            const baseMultiplier = 3;
            
            const cooldown = Math.max(10, baseCooldown - (0.9 * kg));
            const amount = baseAmount + (1.3 * kg);
            const chance = baseChance + (0.5 * kg);
            const multiplier = baseMultiplier + (0.4 * kg);
            
            const cooldownMod = baseCooldown * modifier;
            const amountMod = baseAmount * modifier;
            const chanceMod = baseChance * modifier;
            const multiplierMod = baseMultiplier * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(10, adjustedBaseCooldown - (0.9 * kg));
            const amountTotal = amount + amountMod;
            const chanceTotal = chance + chanceMod;
            const multiplierTotal = multiplier + multiplierMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${cooldownTotal.toFixed(1)} seconds</strong>, goes to the cosmetic crate with the highest open time, and reduces its open time by <strong>${amountTotal.toFixed(1)} seconds</strong>! There is a <strong>${chanceTotal.toFixed(1)}%</strong> chance for open time reduction to be multiplied by <strong>${multiplierTotal.toFixed(1)}x</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 0.9s (min 10s), increases reduction amount by 1.3s, increases chance by 0.5%, and increases multiplier by 0.4x"
    },

    rainbowIguanodon: {
        name: "Rainbow Iguanodon",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/fb/RainbowIguanodon.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Provides XP bonus to all active Dinosaur type pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 1.2;
            const chance = baseChance + (0.12 * kg);
            
            const chanceMod = baseChance * modifier;
            const chanceTotal = chance + chanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All active Dinosaur type pets gain an additional <strong>${chanceTotal.toFixed(2)} XP/s</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases Dinosaur pets' XP bonus by 0.12 XP/s"
    },

    rainbowPachycephalosaurus: {
        name: "Rainbow Pachycephalosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/9/97/RainbowPachycephalosaurus.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Provides chance to duplicate crafted items",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 12;
            const chance = Math.min(50, baseChance + (0.6 * kg));
            
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(50, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Grants a <strong>${chanceTotal.toFixed(1)}%</strong> chance to duplicate a crafted item${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases duplication chance by 0.6% (max 50%)"
    },

    rainbowDilophosaurus: {
        name: "Rainbow Dilophosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/d8/RainbowDilophosaurus.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Spits venom to advance pet cooldowns or grant XP",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 643;
            const baseNumber = 3;
            const baseAmountCD = 80;
            const baseAmountXP = 1000;
            
            const cooldown = Math.max(60, baseCooldown - (6.4 * kg));
            const number = Math.min(12, baseNumber + (0.2 * kg));
            const amountCD = Math.min(160, baseAmountCD + kg);
            const amountXP = Math.min(6000, baseAmountXP + (80 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const numberMod = baseNumber * modifier;
            const amountCDMod = baseAmountCD * modifier;
            const amountXPMod = baseAmountXP * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(60, adjustedBaseCooldown - (6.4 * kg));
            const numberTotal = Math.min(12, number + numberMod);
            const amountCDTotal = Math.min(160, amountCD + amountCDMod);
            const amountXPTotal = Math.min(6000, amountXP + amountXPMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, opens its frills and spits out venom! The venom spreads to <strong>${numberTotal.toFixed(1)}</strong> other random pets, advancing cooldown by <strong>${amountCDTotal.toFixed(0)}</strong> OR granting <strong>${amountXPTotal.toFixed(0)} XP</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 6.4s (min 1:00), increases targets by 0.2 (max 12), increases cooldown advance by 1s (max 160s), and increases XP by 80 (max 6000)"
    },

    rainbowAnkylosaurus: {
        name: "Rainbow Ankylosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/9/91/RainbowAnkylosaurus.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Protects against fruit theft",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 31.4;
            const chance = Math.min(60, baseChance + (0.5 * kg));
            
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(60, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `When another player steals fruit from you, grants a <strong>${chanceTotal.toFixed(1)}%</strong> chance you get the stolen fruit as well${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases theft protection chance by 0.5% (max 60%)"
    },

    rainbowSpinosaurus: {
        name: "Rainbow Spinosaurus",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/e7/RainbowSpinosaurusIcon.png",
            fallback: "🦕"
        },
        type: "dinosaur",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Devours and spreads mutations with favorited fruit priority",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 912;
            const baseAmount = 6;
            
            const cooldown = Math.max(15, baseCooldown - (6 * kg));
            const amount = baseAmount + (0.4 * kg);
            
            const cooldownMod = baseCooldown * modifier;
            const amountMod = baseAmount * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(15, adjustedBaseCooldown - (6 * kg));
            const amountTotal = amount + amountMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, devours a random mutation from <strong>${amountTotal.toFixed(1)}</strong> fruits in your garden each, then roars, spreading those mutations to 1 random fruit in your garden! Prioritizes applying mutations to a favorited fruit${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 6s (min 15s) and increases fruits affected by 0.4"
    },

    rainbowManekiNeko: {
        name: "Rainbow Maneki-neko",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/0e/RainbowManekiNeko.png",
            fallback: "🐱"
        },
        type: "other",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced fortune cat with improved fruit refund chances",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 72;
            const baseChance = 15;
            const baseDuration = 20;
            
            const cooldown = Math.max(15, baseCooldown - (0.6 * kg));
            const chance = Math.min(30, baseChance + (0.3 * kg));
            const duration = Math.min(42, baseDuration + (0.25 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const chanceMod = baseChance * modifier;
            const durationMod = baseDuration * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(15, adjustedBaseCooldown - (0.6 * kg));
            const chanceTotal = Math.min(30, chance + chanceMod);
            const durationTotal = Math.min(42, duration + durationMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, waves and invites good fortune that grants <strong>${chanceTotal.toFixed(1)}%</strong> chance to refund fruit back to your inventory for <strong>${durationTotal.toFixed(1)}s</strong>! Rarer fruit have rarer chance to refund${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases wave time by 0.6s (min 15s), increases refund chance by 0.3% (max 30%), and increases duration by 0.25s (max 42s)"
    },

    rainbowKodama: {
        name: "Rainbow Kodama",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/76/RainbowKodama.png",
            fallback: "🌳"
        },
        type: "other",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced tree spirit with improved Tranquil mutation chance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 8;
            const chance = Math.min(16, baseChance + (0.4 * kg));
            
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(16, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${chanceTotal.toFixed(1)}%</strong> chance Zen type fruit gets Tranquil mutation after collecting${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases Tranquil mutation chance by 0.4% (max 16%)"
    },

    rainbowCorruptedKitsune: {
        name: "Rainbow Corrupted Kitsune",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/3f/RainbowCorruptedKitsune.png",
            fallback: "🦊"
        },
        type: "other",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced nine-tailed curse with improved corruption chance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 630;
            const baseChance = 25;
            
            const cooldown = Math.max(30, baseCooldown - (3.6 * kg));
            const chance = Math.min(50, baseChance + (0.2 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const chanceMod = baseChance * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(30, adjustedBaseCooldown - (3.6 * kg));
            const chanceTotal = Math.min(50, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${cooldownTotal.toFixed(1)} seconds</strong>, launches cursed energy at 9 different fruits. Each fruit has <strong>${chanceTotal.toFixed(1)}%</strong> to mutate with <span style="color: rgb(0, 85, 255);">Corrupt Chakra</span> with a very rare chance for <span style="color: rgb(0, 0, 255);">Corrupt Foxfire Chakra</span> instead${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cursed energy time by 3.6s (min 30s) and increases Corrupt Chakra chance by 0.2% (max 50%)"
    },

    rainbowBaconPig: {
        name: "Rainbow Bacon Pig",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/23/RainbowBaconPig.png",
            fallback: "🐷"
        },
        type: "mammal",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced aura that boosts variant chance for new fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 80;
            const baseDuration = 30;
            const baseRange = 30;
            const baseMultiplier = 3;
            
            const cooldown = Math.max(5, baseCooldown - kg);
            const duration = baseDuration + (0.15 * kg);
            const range = baseRange + (0.15 * kg);
            const multiplier = baseMultiplier + (0.01 * kg);
            
            const cooldownMod = baseCooldown * modifier;
            const durationMod = baseDuration * modifier;
            const rangeMod = baseRange * modifier;
            const multiplierMod = baseMultiplier * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(5, adjustedBaseCooldown - kg);
            const durationTotal = duration + durationMod;
            const rangeTotal = range + rangeMod;
            const multiplierTotal = multiplier + multiplierMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${cooldownTotal.toFixed(0)} seconds</strong>, emits an aura for <strong>${durationTotal.toFixed(2)} seconds</strong> granting <strong>${multiplierTotal.toFixed(2)}x</strong> chance for new fruit to grow as variants within <strong>${rangeTotal.toFixed(2)}</strong> studs${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1s (min 5s), increases duration by 0.15s, increases range by 0.15 studs, and increases variant multiplier by 0.01x"
    },

    rainbowHotdogDaschund: {
        name: "Rainbow Hotdog Daschund",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2e/RainbowHotdogDaschund.png",
            fallback: "🌭"
        },
        type: "food",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Drops mustard/ketchup puddles that boost pet performance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 200;
            const baseMultiplier = 0.3;
            const baseAmount = 0.09;
            const baseDuration = 45;
            const baseRadius = 16;
            
            const cooldown = Math.max(60, baseCooldown - (1.5 * kg));
            const multiplier = Math.min(0.4, baseMultiplier + (0.01 * kg));
            const amount = Math.min(0.75, baseAmount + (0.075 * kg));
            const duration = Math.min(60, baseDuration + (0.15 * kg));
            const radius = Math.min(32, baseRadius + (0.08 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const multiplierMod = baseMultiplier * modifier;
            const amountMod = baseAmount * modifier;
            const durationMod = baseDuration * modifier;
            const radiusMod = baseRadius * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(60, adjustedBaseCooldown - (1.5 * kg));
            const multiplierTotal = Math.min(0.4, multiplier + multiplierMod);
            const amountTotal = Math.min(0.75, amount + amountMod);
            const durationTotal = Math.min(60, duration + durationMod);
            const radiusTotal = Math.min(32, radius + radiusMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${cooldownTotal.toFixed(0)} seconds</strong>, drops a <strong>${radiusTotal.toFixed(1)} stud</strong> mustard or ketchup puddle that lasts <strong>${durationTotal.toFixed(1)} seconds</strong>. Pets on mustard have their cooldowns tick by <strong>${amountTotal.toFixed(3)}</strong> faster and pets on ketchup gain <strong>${(multiplierTotal * 100).toFixed(1)}%</strong> more experience${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1.5s (min 60s), increases XP multiplier by 1% (max 40%), increases cooldown boost by 0.075 (max 0.75), increases duration by 0.15s (max 60s), and increases radius by 0.08 studs (max 32)"
    },

    rainbowLobsterThermidor: {
        name: "Rainbow Lobster Thermidor",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/dd/LobsterThermidor.png",
            fallback: "🦞"
        },
        type: "food",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Dual ability: Applies both Molten and Meteoric mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            // First ability - Molten
            const baseCooldown1 = 700;
            const baseChance1 = 40;
            const cooldown1 = Math.max(200, baseCooldown1 - (4.5 * kg));
            const chance1 = baseChance1 + (0.2 * kg);
            
            // Second ability - Meteoric
            const baseCooldown2 = 1400;
            const baseChance2 = 20;
            const cooldown2 = Math.max(400, baseCooldown2 - (8.5 * kg));
            const chance2 = baseChance2 + (0.2 * kg);
            
            // Apply modifiers
            const cooldown1Mod = baseCooldown1 * modifier;
            const chance1Mod = baseChance1 * modifier;
            const cooldown2Mod = baseCooldown2 * modifier;
            const chance2Mod = baseChance2 * modifier;
            
            const adjustedBaseCooldown1 = baseCooldown1 - cooldown1Mod;
            const adjustedBaseCooldown2 = baseCooldown2 - cooldown2Mod;
            const cooldown1Total = Math.max(200, adjustedBaseCooldown1 - (4.5 * kg));
            const cooldown2Total = Math.max(400, adjustedBaseCooldown2 - (8.5 * kg));
            const chance1Total = chance1 + chance1Mod;
            const chance2Total = chance2 + chance2Mod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>Dual Ability:</strong><br>Every <strong>${Utils.formatTime(cooldown1Total)}</strong>, <strong>${chance1Total.toFixed(1)}%</strong> chance a nearby fruit becomes Molten!<br>Every <strong>${Utils.formatTime(cooldown2Total)}</strong>, <strong>${chance2Total.toFixed(1)}%</strong> chance a nearby fruit becomes Meteoric${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases Molten cooldown by 4.5s (min 3:20), decreases Meteoric cooldown by 8.5s (min 6:40), and increases both chances by 0.2%"
    },

    rainbowElk: {
        name: "Rainbow Elk",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/32/Elk.png",
            fallback: "🦌"
        },
        type: "mammal",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced berry fruit preservation with improved chances",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 5;
            const chance = Math.min(10, baseChance + (0.05 * kg));
            
            // Apply modifiers
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(10, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${chanceTotal.toFixed(2)}%</strong> chance berry fruit stays after collecting! Rarer plants have rarer chance to replant${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases berry preservation chance by 0.05% (max 10%)"
    },

    rainbowMandrake: {
        name: "Rainbow Mandrake",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2f/MandrakePet.png",
            fallback: "🧄"
        },
        type: "plant",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced Mandrake with improved Rot mutation chance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 7;
            const chance = Math.min(14, baseChance + (0.15 * kg));
            
            // Apply modifiers
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(14, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Harvesting Mandrake crops have a <strong>${chanceTotal.toFixed(2)}%</strong> chance to apply Rot mutation to a random fruit in your garden${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases Rot mutation chance by 0.15% (max 14%)"
    },

    rainbowGriffin: {
        name: "Rainbow Griffin",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7b/GriffinPet.png",
            fallback: "🦅"
        },
        type: "mythical",
        rarity: "Rainbow Exotic",
        source: "Rainbow Exotic",
        probability: 0,
        obtainable: false,
        description: "Enhanced Griffin that releases multiple cyclones",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 615;
            const baseCooldownAmount = 100;
            const baseChance = 18;
            const cycloneAmount = 2; // Fixed at 2 cyclones
            
            const cooldown = Math.max(150, baseCooldown - (2 * kg));
            const cooldownAmount = Math.min(200, baseCooldownAmount + (1.5 * kg));
            const chance = Math.min(50, baseChance + (0.18 * kg));
            
            // Apply modifiers
            const cooldownMod = baseCooldown * modifier;
            const cooldownAmountMod = baseCooldownAmount * modifier;
            const chanceMod = baseChance * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(150, adjustedBaseCooldown - (2 * kg));
            const cooldownAmountTotal = Math.min(200, cooldownAmount + cooldownAmountMod);
            const chanceTotal = Math.min(50, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, flaunts its wings and releases <strong>${cycloneAmount}</strong> Cyclones. Pets struck have cooldown advanced by <strong>${cooldownAmountTotal.toFixed(1)}s</strong> and fruits struck have a <strong>${chanceTotal.toFixed(1)}%</strong> chance to get the Cyclonic mutation${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 2s (min 2:30), increases cooldown advance by 1.5s (max 200s), and increases Cyclonic chance by 0.18% (max 50%)"
    }
};

module.exports = { RAINBOW_EXOTIC_PETS: rainbowExoticPets };
