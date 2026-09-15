let ICONS = {}; let RARITIES = {}; let TYPES = {}; try { ({ ICONS } = require('../data/icons.js')); ({ RARITIES, TYPES } = require('../data/constants.js')); } catch {}
const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const CHESTS_EVENTS_OTHER_PETS = {
    goldenbee: {
        name: "Golden Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/e8/GoldenBee.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 50,
        obtainable: false,
        description: "Pollinates fruits and provides gold harvest chance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1510;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(150, adjustedBaseSeconds - (16 * kg));
            const goldChance = 1 + (kg / 10);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it, applying Pollinated mutation!\n\n<strong>${goldChance.toFixed(1)}%</strong> chance harvested fruit becomes Gold on harvest!\nRarer crops have less chance to turn gold!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds and increases gold harvest chance by 0.1%"
    },
    packbee: {
        name: "Pack Bee",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/fe/PackBee.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 50,
        obtainable: true,
        description: "Pollinates fruits and increases backpack size",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const seconds = Math.max(150, 1510 - (16 * kg));
            const backpackIncrease = 25 + kg;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, flies to a nearby fruit and pollinates it, applying Pollinated mutation!\n\nIncreases player backpack size by <strong>${backpackIncrease}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases pollination time by 16 seconds and increases backpack size by 1"
    },
    baconpig: {
        name: "Bacon Pig",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/b1/BaconPig.png",
            fallback: "🐷"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Culinarian Chest",
        probability: 34.5,
        obtainable: true,
        description: "Emits aura that boosts variant chance for new fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 120;
            const cooldownMod = baseCooldown * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(5, adjustedBaseCooldown - kg);
            const duration = 15 + (0.15 * kg);
            const multiplier = 2 + (0.01 * kg);
            const range = 15 + (0.15 * kg);
            
            const durationMod = 15 * modifier;
            const multiplierMod = 2 * modifier;
            const rangeMod = 15 * modifier;
            const durationTotal = duration + durationMod;
            const multiplierTotal = multiplier + multiplierMod;
            const rangeTotal = range + rangeMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldown)}</strong>, emits an aura for <strong>${Utils.formatTime(durationTotal)}</strong> granting <strong>${multiplierTotal.toFixed(2)}x</strong> chance for new fruit to grow as variants within <strong>${rangeTotal.toFixed(2)}</strong> studs${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1 second, increases duration by 0.15 seconds, increases variant multiplier by 0.01x, and increases range by 0.15 studs"
    },
    hamster: {
        name: "Hamster",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/c/c5/HamsterIcon.webp",
            fallback: "🐹"
        },
        type: "mammal",
        rarity: "Mythical",
        source: "Event",
        probability: 0,
        obtainable: false,
        description: "Reduces egg hatch times",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 15;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(20, adjustedBaseSeconds - kg);
            const reduction = 15 + (0.25 * kg);
            
            const reductionMod = 15 * modifier;
            const reductionTotal = reduction + reductionMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to the egg with the highest hatch time and reduces its hatch time by <strong>${Utils.formatTime(reductionTotal)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases action time by 1 second and increases hatch time reduction by 0.25 seconds"
    },
    monkey: {
        name: "Monkey",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/8/85/Monkey_Pet_V2.png",
            fallback: "🐒"
        },
        type: "mammal",
        rarity: "Rare",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Refunds fruits back to inventory",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const refundChance = 2.5 + (kg / 40);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${refundChance.toFixed(2)}%</strong> chance to refund fruit back to your inventory. Rarer plants have lower chance to refund!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases fruit refund chance by 0.025%"
    },
    mooncat: {
        name: "Moon Cat",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/ee/Moon_Cat.png",
            fallback: "🌙"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Twilight Shop",
        probability: 0,
        obtainable: false,
        description: "Naps to provide size bonuses and preserves Night type fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseNapInterval = 70;
            const napIntervalMod = baseNapInterval * modifier;
            const adjustedBaseNapInterval = baseNapInterval + napIntervalMod;
            const napInterval = Math.max(15, adjustedBaseNapInterval - kg);
            const napDuration = 20 + (kg / 5);
            const range = 15 + (kg / 10);
            const sizeMultiplier = 1.35 + (kg / 100);
            const preserveChance = 1.5 + (kg / 20);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(napInterval)}</strong>, naps for <strong>${Utils.formatTime(napDuration)}</strong>. New fruit within <strong>${range.toFixed(1)}</strong> studs will be <strong>${sizeMultiplier.toFixed(3)}x</strong> larger!\n\n<strong>${preserveChance.toFixed(2)}%</strong> chance Night type fruit stays after harvest!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases nap interval by 1 second, increases nap duration by 0.2 seconds, increases range by 0.1 studs, increases size multiplier by 0.01x, and increases night preservation chance by 0.05%"
    },
    nihonzaru: {
        name: "Nihonzaru",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/db/Nihonzaru_.png",
            fallback: "🐒"
        },
        type: "mammal",
        rarity: "Rare",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Bathes in hot springs to boost all pets' passive abilities",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const basePassiveBoost = 2;
            const basePassiveBoostMod = basePassiveBoost * modifier;
            const adjustedBasePassiveBoost = basePassiveBoost + basePassiveBoostMod;
            const passiveBoost = Math.min(6, adjustedBasePassiveBoost + (kg/10));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `As long as you have a Hot Spring in your garden: The pet bathes in it and boosts all pets passive by <strong>${passiveBoost.toFixed(3)}%</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases all pets' passive boost by 0.1%"
    },
    panda: {
        name: "Panda",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/9/94/PandaPet.png",
            fallback: "🐼"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Eats bamboo for value bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 180;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - kg);
            const bonus = 1.5 + (0.015 * kg);
            
            const bonusMod = 1.5 * modifier;
            const bonusTotal = bonus + bonusMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, eats bamboo for a <strong>${bonusTotal.toFixed(3)}x</strong> value bonus${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases feeding time by 1 second and increases value bonus by 0.015x"
    },
    chickenzombie: {
        name: "Chicken Zombie",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/be/Chicken_Zombie_Icon.png",
            fallback: "🧟"
        },
        type: "undead",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Zombifies fruits and increases egg hatch speed",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1600;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(15, adjustedBaseSeconds - (18 * kg));
            const zombifyChance = 20 + (kg / 5);
            const hatchSpeed = 10 + (kg / 10);
            
            const hatchSpeedMod = 10 * modifier;
            const hatchSpeedTotal = hatchSpeed + hatchSpeedMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${zombifyChance.toFixed(1)}%</strong> chance a nearby fruit becomes Zombified!\n\nIncreases egg hatch speed by <strong>${hatchSpeedTotal.toFixed(1)}%</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases zombify time by 18 seconds, increases zombify chance by 0.2%, and increases egg hatch speed by 0.1%"
    },
    mochimouse: {
        name: "Mochi Mouse",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/78/MochiMouse.png",
            fallback: "🍡"
        },
        type: "food",
        rarity: "Legendary",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: true,
        description: "Provides XP bonuses to Food type pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseXpBonus = 0.75;
            const xpBonus = baseXpBonus + (0.15 * kg);
            
            const xpBonusMod = baseXpBonus * modifier;
            const xpBonusTotal = xpBonus + xpBonusMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All active Food type pets gain an additional <strong>${xpBonusTotal.toFixed(2)} XP/s</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases Food type pets' XP bonus by 0.15 XP/s"
    },
    koi: {
        name: "Koi",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2f/Koi.webp",
            fallback: "🐟"
        },
        type: "aquatic",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Provides chance to recover eggs when hatching",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseRecoveryChance = 3;
            const recoveryChanceMod = baseRecoveryChance * modifier;
            const adjustedBaseRecoveryChance = baseRecoveryChance + recoveryChanceMod;
            const recoveryChance = Math.min(8, adjustedBaseRecoveryChance + (kg * 0.22));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `When hatching eggs there is a <strong>${recoveryChance.toFixed(2)}%</strong> chance to get the egg back! Cannot recover Premium/Exotic Eggs.${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases egg recovery chance by 0.22%"
    },
    football: {
        name: "Football",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/10/FootballPet.png",
            fallback: "🏈"
        },
        type: "other",
        rarity: "Legendary",
        source: "Event",
        probability: 0,
        obtainable: false,
        description: "Touchdown: Occasionally runs to the Gear Shop or Seed Shop (whichever is farther) and does a touchdown which awards you with sheckles or a Watering Can",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const wateringCanChance = 20 + (kg / 3);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(87)}</strong>, runs to the Gear Shop or Seed Shop (whichever is farther) and does a touchdown which awards you with <strong>${Utils.formatNumber(870)}</strong> Sheckles or <strong>${wateringCanChance.toFixed(2)}%</strong> chance for a Watering Can instead!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases watering can chance by 0.33%"
    },
    manekineko: {
        name: "Maneki-neko",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/64/ManekiNeko.png",
            fallback: "🐱"
        },
        type: "other",
        rarity: "Uncommon",
        source: "Kitsune Chest",
        probability: 34.50,
        obtainable: false,
        description: "Fortune Cat: Occasionally does a wave of good luck and grants increased chance to get your fruit back after selling it",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 143;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(30, adjustedBaseSeconds - (0.6 * kg));
            const refundChance = 8 + (0.15 * kg);
            const duration = 10 + (kg / 4);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, waves and invites good fortune that grants <strong>${refundChance.toFixed(2)}%</strong> chance to refund fruit back to your inventory for <strong>${Utils.formatTime(duration)}</strong>! Rarer fruit have rarer chance to refund.${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases wave time by 0.6 seconds, increases refund chance by 0.15%, and increases effect duration by 0.25 seconds"
    },
    kodama: {
        name: "Kodama",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/1/18/Kodama.png",
            fallback: "🌳"
        },
        type: "other",
        rarity: "Legendary",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Tree Spirit: Collecting Zen type fruits have a chance to mutate with Tranquil.",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const chance = Math.min(12, 6 + (0.33 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(chance)}</strong>, collecting Zen type fruit has a <strong>${chance.toFixed(2)}%</strong> chance to mutate with Tranquil!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases Tranquil mutation chance by 0.33%"
    },
    corruptedkodama: {
        name: "Corrupted Kodama",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/68/Corrupt_Kodama.png",
            fallback: "🌚"
        },
        type: "other",
        rarity: "Legendary",
        source: "Quest",
        probability: 4.35,
        obtainable: false,
        description: "Corrupted Tree Spirit: Collecting Zen type fruits have a chance to mutate with Corrupt.",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const chance = Math.min(12, 6 + (0.33 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Collecting Zen type fruit has a <strong>${chance.toFixed(2)}%</strong> chance to mutate with Corrupt!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases Corrupt mutation chance by 0.33%"
    },
    raiju: {
        name: "Raiju",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/0d/Raiju.png",
            fallback: "⚡"
        },
        type: "other",
        rarity: "Mythical",
        source: "Event",
        probability: 0,
        obtainable: false,
        description: "Lightning Beast: Occasionally devours a fruit with Shocked for bonus value, spits a chain lightning that mutates fruit with Static or Shocked if its a Thunderstorm",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 622;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (2.6 * kg));
            const targets = Math.min(9, 4 + (0.15 * kg));
            const shockedChance = Math.min(35, 20 + (0.15 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, devours a fruit with Shocked mutation for <strong>1.5x</strong> sheckle value to Summon a chain of lightning to mutate <strong>${targets.toFixed(1)}</strong> fruits with Static! During a Thunderstorm: <strong>${shockedChance.toFixed(2)}%</strong> chance for Shocked instead!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases lightning time by 2.6 seconds, increases targets by 0.15, and increases Shocked chance by 0.15%"
    },
    corruptedkitsune: {
        name: "Corrupted Kitsune",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2a/CorruptedKitsune.png",
            fallback: "🦊"
        },
        type: "other",
        rarity: "Prismatic",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Nine-Tailed Curse: Occasionally, Removes 9 mutations from 9 different fruit. Applies Corrupted Chakra with a very rare chance for Corrupted Foxfire Chakra to 1 random fruit.",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1260;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (3.6 * kg));
            const chakraChance = 20 + (kg / 5);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, launches cursed energy at 9 different fruits. Each fruit has <strong>${chakraChance.toFixed(2)}%</strong> to mutate with <span style="color: rgb(0, 85, 255);">Corrupt Chakra</span> with a very rare chance for <span style="color: rgb(0, 0, 255);">Corrupt Foxfire Chakra</span> instead!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases cursed energy time by 3.6 seconds and increases Corrupt Chakra chance by 0.2%"
    },
    baldeagle: {
        name: "Bald Eagle",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/d2/BaldEagle.png",
            fallback: "🦅"
        },
        type: "bird",
        rarity: "Legendary",
        source: "Event",
        probability: 0,
        obtainable: false,
        description: "Takes flight and advances egg hatch times with chance for multiplied effect",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseInterval = 704;
            const baseIntervalMod = baseInterval * modifier;
            const baseIntervalTotal = baseInterval - baseIntervalMod;
            const baseAdvance = 70.4;
            const baseChancePercent = 70.4;
            const baseMultiplier = 1.8;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${baseIntervalTotal} seconds</strong>, takes flight and spreads its wings. All eggs advance their hatch time by <strong>${baseAdvance} seconds</strong>!\n\nThere's a <strong>${baseChancePercent}%</strong> chance for the time advance to be multiplied by <strong>${baseMultiplier.toFixed(2)}x</strong>!`;
        },
        perKgImpact: () => "Each additional kg increases multiplier by 0.18x"
    },
    cookedowl: {
        name: "Cooked Owl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/f/fc/Cooked_Owl.png",
            fallback: "🍗"
        },
        type: "bird",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Cooks fruits and provides XP bonuses to all pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 806;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(60, adjustedBaseSeconds - (12 * kg));
            const cookChance = 15 + (kg / 4);
            const xpBonus = 0.15 + (0.03 * kg);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${cookChance.toFixed(2)}%</strong> chance to cook a nearby fruit. Usually Burnt.\n\nAll active pets gain an additional <strong>${xpBonus.toFixed(2)} XP/s</strong>! Also very tasty!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases cooking time by 12 seconds, increases cooking chance by 0.25%, and increases all pets' XP bonus by 0.03 XP/s"
    },
    kiwi: {
        name: "Kiwi",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/ea/Kiwi.png",
            fallback: "🥝"
        },
        type: "bird",
        rarity: "Rare",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Reduces egg hatch times",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(10, adjustedBaseSeconds - kg);
            const reduction = 25 + (kg / 4);
            
            const reductionMod = 25 * modifier;
            const reductionTotal = reduction + reductionMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to the egg with the highest hatch time and reduces its hatch time by <strong>${Utils.formatTime(reductionTotal)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases action time by 1 second and increases hatch time reduction by 0.25 seconds"
    },
    owl: {
        name: "Owl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/4/46/Owlpng.png",
            fallback: "🦉"
        },
        type: "bird",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 0,
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
    tanchozuru: {
        name: "Tanchozuru",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/d3/Tanchozuru_.png",
            fallback: "🕊️"
        },
        type: "bird",
        rarity: "Legendary",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Meditates to grant Tranquil mutations to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseMeditateInterval = 627;
            const meditateIntervalMod = baseMeditateInterval * modifier;
            const adjustedBaseMeditateInterval = baseMeditateInterval + meditateIntervalMod;
            const meditateInterval = Math.max(1, adjustedBaseMeditateInterval - kg);
            const meditateDuration = 10 + (kg / 10);
            const range = 15 + (kg / 10);
            const tranquilChance = 5 + (kg / 20);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(meditateInterval)}</strong>, meditates for <strong>${Utils.formatTime(meditateDuration)}</strong>, nearby fruits in a <strong>${range.toFixed(1)}</strong> studs have a <strong>${tranquilChance.toFixed(2)}%</strong> chance every second to mutate into Tranquil!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases meditation interval by 1 second, increases meditation duration by 0.1 seconds, increases range by 0.1 studs, and increases tranquil chance by 0.05%"
    },
    bloodkiwi: {
        name: "Blood Moon Kiwi",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/79/Blood_Kiwi_Icon.png",
            fallback: "🥝"
        },
        type: "bird",
        rarity: "Mythical",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Reduces egg hatch times",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(10, adjustedBaseSeconds - kg);
            const reduction = 45 + (0.45 * kg);
            
            const reductionMod = 45 * modifier;
            const reductionTotal = reduction + reductionMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to the egg with the highest hatch time, and reduces its hatch time by <strong>${reductionTotal.toFixed(2)}</strong> seconds${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases action time by 1 second and increases hatch time reduction by 0.45 seconds"
    },
    bloodhedgehog: {
        name: "Blood Hedgehog",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/9/95/Blood_Hedgehog_Icon.png",
            fallback: "🦔"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Provides size and variant bonuses to prickly plants",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSizeRange = 30;
            const baseSizeBonus = 2;
            const baseVariantRange = 22;
            const baseVariantBonus = 1.15;
            
            const sizeRange = baseSizeRange + (kg / 5);
            const sizeBonus = baseSizeBonus + (kg / 50);
            const variantRange = baseVariantRange + (kg / 5);
            const variantBonus = baseVariantBonus + (kg / 90);
            
            const sizeRangeMod = baseSizeRange * modifier;
            const sizeBonusMod = baseSizeBonus * modifier;
            const variantRangeMod = baseVariantRange * modifier;
            const variantBonusMod = baseVariantBonus * modifier;
            
            const sizeRangeTotal = sizeRange + sizeRangeMod;
            const sizeBonusTotal = sizeBonus + sizeBonusMod;
            const variantRangeTotal = variantRange + variantRangeMod;
            const variantBonusTotal = variantBonus + variantBonusMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Grants prickly plants in <strong>${sizeRangeTotal.toFixed(1)}</strong> studs a <strong>${sizeBonusTotal.toFixed(2)}x</strong> size bonus and prickly plants in <strong>${variantRangeTotal.toFixed(1)}</strong> studs a <strong>${variantBonusTotal.toFixed(3)}x</strong> variant chance!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases size range by 0.2 studs, size bonus by 0.02x, variant range by 0.2 studs, and variant bonus by 0.011x"
    },
    bloodowl: {
        name: "Blood Owl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/00/Blood_Owl_Icon.png",
            fallback: "🦉"
        },
        type: "bird",
        rarity: "Divine",
        source: "Chests/Events/Other",
        probability: 0,
        obtainable: false,
        description: "Provides XP bonuses to all active pets",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseXpBonus = 0.5;
            const xpBonus = baseXpBonus + (0.08 * kg);
            
            const xpBonusMod = baseXpBonus * modifier;
            const xpBonusTotal = xpBonus + xpBonusMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `All active pets gain an additional <strong>${xpBonusTotal.toFixed(2)} XP/s</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases all pets' XP bonus by 0.08 XP/s"
    },

    spriggan: {
        name: "Spriggan",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/6/6f/Spriggan.png",
            fallback: "🌳"
        },
        type: "nature",
        rarity: "Legendary",
        source: "Beanstalk Event",
        probability: 0,
        obtainable: true,
        description: "Spreads roots to apply Bloom mutation to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 1330;
            const baseChance = 15;
            const baseRange = 30;
            const cooldown = Math.max(600, baseCooldown - (6 * kg));
            const chance = Math.min(30, baseChance + (0.15 * kg));
            const range = Math.min(60, baseRange + (0.3 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const chanceMod = baseChance * modifier;
            const rangeMod = baseRange * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(600, adjustedBaseCooldown - (6 * kg));
            const chanceTotal = Math.min(30, chance + chanceMod);
            const rangeTotal = Math.min(60, range + rangeMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, spreads its roots and all fruit within <strong>${rangeTotal.toFixed(1)}</strong> studs have a <strong>${chanceTotal.toFixed(1)}%</strong> to get the Bloom mutation${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 6 seconds (min 10:00), increases Bloom chance by 0.15% (max 30%), and increases range by 0.3 studs (max 60)"
    },

    baconpig: {
        name: "Bacon Pig",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/b1/BaconPig.png",
            fallback: "🐷"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Culinarian Chest",
        probability: 34.5,
        obtainable: true,
        description: "Emits aura that boosts variant chance for new fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 120;
            const baseDuration = 15;
            const baseRange = 15;
            const baseMultiplier = 2;
            
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
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, emits an aura for <strong>${Utils.formatTime(durationTotal)}</strong> granting <strong>${multiplierTotal.toFixed(2)}x</strong> chance for new fruit to grow as variants within <strong>${rangeTotal.toFixed(2)}</strong> studs${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1 second (min 5s), increases duration by 0.15 seconds, increases range by 0.15 studs, and increases variant multiplier by 0.01x"
    },

    hotdogDaschund: {
        name: "Hotdog Daschund",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/24/HotdogDaschund.png",
            fallback: "🌭"
        },
        type: "food",
        rarity: "Mythical",
        source: "Culinarian Chest",
        probability: 14.5,
        obtainable: true,
        description: "Drops mustard/ketchup puddles that boost pet performance",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 240;
            const baseMultiplier = 0.2;
            const baseAmount = 0.06;
            const baseDuration = 30;
            const baseRadius = 8;
            
            const cooldown = Math.max(80, baseCooldown - (1.5 * kg));
            const multiplier = Math.min(0.4, baseMultiplier + (0.01 * kg));
            const amount = Math.min(0.5, baseAmount + (0.05 * kg));
            const duration = Math.min(45, baseDuration + (0.15 * kg));
            const radius = Math.min(16, baseRadius + (0.08 * kg));
            
            const cooldownMod = baseCooldown * modifier;
            const multiplierMod = baseMultiplier * modifier;
            const amountMod = baseAmount * modifier;
            const durationMod = baseDuration * modifier;
            const radiusMod = baseRadius * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(80, adjustedBaseCooldown - (1.5 * kg));
            const multiplierTotal = Math.min(0.4, multiplier + multiplierMod);
            const amountTotal = Math.min(0.5, amount + amountMod);
            const durationTotal = Math.min(45, duration + durationMod);
            const radiusTotal = Math.min(16, radius + radiusMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, drops a <strong>${radiusTotal.toFixed(1)} stud</strong> mustard or ketchup puddle that lasts <strong>${Utils.formatTime(durationTotal)}</strong>. Pets on mustard have their cooldowns tick by <strong>${amountTotal.toFixed(3)}</strong> faster and pets on ketchup gain <strong>${(multiplierTotal * 100).toFixed(1)}%</strong> more experience${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1.5s (min 1:20), increases XP multiplier by 1% (max 40%), increases cooldown boost by 0.05 (max 0.5), increases duration by 0.15s (max 45s), and increases radius by 0.08 studs (max 16)"
    },

    lobsterThermidor: {
        name: "Lobster Thermidor",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/d/dd/LobsterThermidor.png",
            fallback: "🦞"
        },
        type: "food",
        rarity: "Divine",
        source: "Culinarian Chest",
        probability: 1,
        obtainable: true,
        description: "Dual ability: Applies both Molten and Meteoric mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            // First ability - Molten
            const baseCooldown1 = 900;
            const baseChance1 = 20;
            const cooldown1 = Math.max(300, baseCooldown1 - (4.5 * kg));
            const chance1 = baseChance1 + (0.1 * kg);
            
            // Second ability - Meteoric
            const baseCooldown2 = 1800;
            const baseChance2 = 10;
            const cooldown2 = Math.max(500, baseCooldown2 - (8.5 * kg));
            const chance2 = baseChance2 + (0.1 * kg);
            
            // Apply modifiers
            const cooldown1Mod = baseCooldown1 * modifier;
            const chance1Mod = baseChance1 * modifier;
            const cooldown2Mod = baseCooldown2 * modifier;
            const chance2Mod = baseChance2 * modifier;
            
            const adjustedBaseCooldown1 = baseCooldown1 - cooldown1Mod;
            const adjustedBaseCooldown2 = baseCooldown2 - cooldown2Mod;
            const cooldown1Total = Math.max(300, adjustedBaseCooldown1 - (4.5 * kg));
            const cooldown2Total = Math.max(500, adjustedBaseCooldown2 - (8.5 * kg));
            const chance1Total = chance1 + chance1Mod;
            const chance2Total = chance2 + chance2Mod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>Dual Ability:</strong><br>Every <strong>${Utils.formatTime(cooldown1Total)}</strong>, <strong>${chance1Total.toFixed(1)}%</strong> chance a nearby fruit becomes Molten!<br>Every <strong>${Utils.formatTime(cooldown2Total)}</strong>, <strong>${chance2Total.toFixed(1)}%</strong> chance a nearby fruit becomes Meteoric${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases Molten cooldown by 4.5s (min 5:00), decreases Meteoric cooldown by 8.5s (min 8:20), and increases both chances by 0.1%"
    },

    peachWasp: {
        name: "Peach Wasp",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/4/4e/PeachWasp.png",
            fallback: "🐝"
        },
        type: "insect",
        rarity: "Mythical",
        source: "Admin Abuse War",
        probability: 0,
        obtainable: false,
        description: "Dual ability: Applies Plasma mutations and advances pet cooldowns",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            // First ability - Plasma mutation
            const baseCooldown1 = 1500;
            const cooldown1 = Math.max(200, baseCooldown1 - (6.6 * kg));
            
            // Second ability - Advance pet cooldowns
            const baseCooldown2 = 602;
            const baseAmount = 60;
            const cooldown2 = Math.max(300, baseCooldown2 - (3.5 * kg));
            const amount = Math.min(120, baseAmount + (0.6 * kg));
            
            // Apply modifiers
            const cooldown1Mod = baseCooldown1 * modifier;
            const cooldown2Mod = baseCooldown2 * modifier;
            const amountMod = baseAmount * modifier;
            
            const adjustedBaseCooldown1 = baseCooldown1 - cooldown1Mod;
            const adjustedBaseCooldown2 = baseCooldown2 - cooldown2Mod;
            const cooldown1Total = Math.max(200, adjustedBaseCooldown1 - (6.6 * kg));
            const cooldown2Total = Math.max(300, adjustedBaseCooldown2 - (3.5 * kg));
            const amountTotal = Math.min(120, amount + amountMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>Dual Ability:</strong><br>Every <strong>${Utils.formatTime(cooldown1Total)}</strong>, flies to a nearby fruit and Plasmafies it, applying Plasma mutation!<br>Every <strong>${Utils.formatTime(cooldown2Total)}</strong>, stings a random pet and advances its ability cooldown by <strong>${amountTotal.toFixed(1)}s</strong>${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases Plasma cooldown by 6.6s (min 3:20), decreases sting cooldown by 3.5s (min 5:00), and increases cooldown advance by 0.6s (max 120s)"
    },

    appleGazelle: {
        name: "Apple Gazelle",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/b/bc/AppleGazelle.png",
            fallback: "🦌"
        },
        type: "mammal",
        rarity: "Mythical",
        source: "Admin Abuse War",
        probability: 0,
        obtainable: false,
        description: "Dual ability: Duplicates apple fruits and applies Warped mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            // First ability - Apple duplication
            const baseChance1 = 4;
            const chance1 = Math.min(7, baseChance1 + (0.025 * kg));
            
            // Second ability - Sugar Apple Warped mutation
            const baseChance2 = 2;
            const chance2 = Math.min(4, baseChance2 + (0.05 * kg));
            
            // Apply modifiers
            const chance1Mod = baseChance1 * modifier;
            const chance2Mod = baseChance2 * modifier;
            const chance1Total = Math.min(7, chance1 + chance1Mod);
            const chance2Total = Math.min(4, chance2 + chance2Mod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>Dual Ability:</strong><br>Fruits that have apple in the name have a <strong>${chance1Total.toFixed(2)}%</strong> chance to duplicate when collected!<br>Harvesting Sugar Apple crops have a <strong>${chance2Total.toFixed(2)}%</strong> chance to apply Warped mutation to a random fruit in your garden${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases apple duplication chance by 0.025% (max 7%) and increases Warped mutation chance by 0.05% (max 4%)"
    },

    lemonLion: {
        name: "Lemon Lion",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2e/Lemon_Lion.png",
            fallback: "🦁"
        },
        type: "mammal",
        rarity: "Mythical",
        source: "Admin Abuse War",
        probability: 0,
        obtainable: false,
        description: "Dual ability: Applies Brainrot mutations and grants citrus experience bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            // First ability - Brainrot mutation
            const baseCooldown1 = 912;
            const cooldown1 = Math.min(300, baseCooldown1 - (3.5 * kg));
            
            // Second ability - Citrus experience bonus
            const baseCooldown2 = 600;
            const baseAmount = 1500;
            const cooldown2 = Math.max(200, baseCooldown2 - (2.5 * kg));
            const amount = Math.min(2500, baseAmount + (15 * kg));
            
            // Apply modifiers
            const cooldown1Mod = baseCooldown1 * modifier;
            const cooldown2Mod = baseCooldown2 * modifier;
            const amountMod = baseAmount * modifier;
            
            const adjustedBaseCooldown1 = baseCooldown1 - cooldown1Mod;
            const adjustedBaseCooldown2 = baseCooldown2 - cooldown2Mod;
            const cooldown1Total = Math.min(300, adjustedBaseCooldown1 - (3.5 * kg));
            const cooldown2Total = Math.max(200, adjustedBaseCooldown2 - (2.5 * kg));
            const amountTotal = Math.min(2500, amount + amountMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>Dual Ability:</strong><br>Every <strong>${Utils.formatTime(cooldown1Total)}</strong>, roars and applies the Brainrot mutation to a random fruit!<br>Every <strong>${Utils.formatTime(cooldown2Total)}</strong>, roars and infuses citrus with a random pet, granting <strong>${Utils.formatNumber(amountTotal)}</strong> bonus experience${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases Brainrot cooldown by 3.5s (max 5:00), decreases citrus cooldown by 2.5s (min 3:20), and increases experience bonus by 15 (max 2500)"
    },

    greenBean: {
        name: "Green Bean",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/4/4b/GreenBean.png",
            fallback: "🫘"
        },
        type: "plant",
        rarity: "Divine",
        source: "Admin Abuse War",
        probability: 0,
        obtainable: false,
        description: "Sacrifices Beanstalk fruits to grow random plants with size bonuses",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 1800;
            const baseMultiplier = 5;
            const cooldown = Math.max(870, baseCooldown - (9 * kg));
            const multiplier = Math.min(10, baseMultiplier + (0.1 * kg));
            
            // Apply modifiers
            const cooldownMod = baseCooldown * modifier;
            const multiplierMod = baseMultiplier * modifier;
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(870, adjustedBaseCooldown - (9 * kg));
            const multiplierTotal = Math.min(10, multiplier + multiplierMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, sacrifices a random Beanstalk fruit in your garden to instantly grow a random plant with <strong>${multiplierTotal.toFixed(1)}x</strong> fruit size bonus! Ability cannot be mimicked or refreshed${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 9s (min 14:30) and increases size multiplier by 0.1x (max 10x)"
    },

    elk: {
        name: "Elk",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/3/32/Elk.png",
            fallback: "🦌"
        },
        type: "mammal",
        rarity: "Uncommon",
        source: "Skyroot Chest",
        probability: 34.5,
        obtainable: true,
        description: "Berry fruits have a chance to stay after collecting",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 2.5;
            const chance = Math.min(5, baseChance + (0.025 * kg));
            
            // Apply modifiers
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(5, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${chanceTotal.toFixed(2)}%</strong> chance berry fruit stays after collecting! Rarer plants have rarer chance to replant${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases berry preservation chance by 0.025% (max 5%)"
    },

    mandrake: {
        name: "Mandrake",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/2/2f/MandrakePet.png",
            fallback: "🧄"
        },
        type: "plant",
        rarity: "Uncommon",
        source: "Skyroot Chest",
        probability: 14.5,
        obtainable: true,
        description: "Harvesting Mandrake crops applies Rot mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 3.5;
            const chance = Math.min(7, baseChance + (0.05 * kg));
            
            // Apply modifiers
            const chanceMod = baseChance * modifier;
            const chanceTotal = Math.min(7, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Harvesting Mandrake crops have a <strong>${chanceTotal.toFixed(2)}%</strong> chance to apply Rot mutation to a random fruit in your garden${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases Rot mutation chance by 0.05% (max 7%)"
    },

    griffin: {
        name: "Griffin",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/7b/GriffinPet.png",
            fallback: "🦅"
        },
        type: "mythical",
        rarity: "Divine",
        source: "Skyroot Chest",
        probability: 1,
        obtainable: true,
        description: "Releases cyclones that advance pet cooldowns and apply Cyclonic mutations",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 935;
            const baseCooldownAmount = 65;
            const baseChance = 10;
            const cooldown = Math.max(300, baseCooldown - (2 * kg));
            const cooldownAmount = Math.min(125, baseCooldownAmount + kg);
            const chance = Math.min(30, baseChance + (0.15 * kg));
            
            // Apply modifiers
            const cooldownMod = baseCooldown * modifier;
            const cooldownAmountMod = baseCooldownAmount * modifier;
            const chanceMod = baseChance * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(300, adjustedBaseCooldown - (2 * kg));
            const cooldownAmountTotal = Math.min(125, cooldownAmount + cooldownAmountMod);
            const chanceTotal = Math.min(30, chance + chanceMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, flaunts its wings and releases a Cyclone. Pets struck have cooldown advanced by <strong>${cooldownAmountTotal.toFixed(1)}s</strong> and fruits struck have a <strong>${chanceTotal.toFixed(1)}%</strong> chance to get the Cyclonic mutation${displayText}!`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 2s (min 5:00), increases cooldown advance by 1s (max 125s), and increases Cyclonic chance by 0.15% (max 30%)"
    },

    gnome: {
        name: "Gnome",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/e4/GnomePet.png",
            fallback: "🧙"
        },
        type: "humanoid",
        rarity: "Legendary",
        source: "Beanstalk Event",
        probability: 0,
        obtainable: true,
        description: "Applies Gnomed mutations with bonus chance for Gnome cosmetics",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 600;
            const baseChance = 1;
            const baseAmount = 1;
            const cooldown = Math.max(200, baseCooldown - (1.5 * kg));
            const chance = Math.min(3, baseChance + (0.025 * kg));
            const amount = Math.min(3, baseAmount + (0.025 * kg));
            
            // Apply modifiers
            const cooldownMod = baseCooldown * modifier;
            const chanceMod = baseChance * modifier;
            const amountMod = baseAmount * modifier;
            
            const adjustedBaseCooldown = baseCooldown - cooldownMod;
            const cooldownTotal = Math.max(200, adjustedBaseCooldown - (1.5 * kg));
            const chanceTotal = Math.min(3, chance + chanceMod);
            const amountTotal = Math.min(3, amount + amountMod);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(cooldownTotal)}</strong>, has a <strong>${chanceTotal.toFixed(2)}%</strong> chance to mutate a random fruit with the Gnomed mutation. Gains additional <strong>${amountTotal.toFixed(2)}%</strong> chance for every Gnome cosmetic in your garden${displayText}.`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 1.5s (min 3:20), increases base chance by 0.025% (max 3%), and increases cosmetic bonus by 0.025% (max 3%)"
    }    
};

module.exports = { CHESTS_EVENTS_OTHER_PETS };
