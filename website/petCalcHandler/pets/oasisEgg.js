const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const OASIS_EGG_PETS = {
    fennecfox: {
        name: "Fennec Fox",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/e8/FennecFoxIcon.png",
            fallback: "🦊"
        },
        type: "mammal",
        rarity: "Divine",
        source: "Oasis Egg",
        probability: 0.50,
        obtainable: false,
        description: "Copies mutations from other players' fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 1350;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(120, adjustedBaseSeconds - (13 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, goes to another player's random fruit, has a chance to copy 1 random mutation and apply it to random fruit you own! The higher mutation multiplier the rarer chance to copy!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases mutation copying time by 13 seconds"
    },
    meerkat: {
        name: "Meerkat",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/c/c2/Meerkat.png",
            fallback: "🦦"
        },
        type: "mammal",
        rarity: "Legendary",
        source: "Oasis Egg",
        probability: 45,
        obtainable: false,
        description: "Does lookouts that advance other pets' cooldowns",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(40, adjustedBaseSeconds - kg);
            const advance = 15 + (kg / 4);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, does a lookout and advances all pets' cooldowns by <strong>${Utils.formatTime(advance)}</strong>!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases lookout time by 1 second and increases cooldown advance by 0.25 seconds"
    },
    hyacinthmacaw: {
        name: "Hyacinth Macaw",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/7/77/HyacinthMacawIcon.png",
            fallback: "🦜"
        },
        type: "bird",
        rarity: "Mythical",
        source: "Oasis Egg",
        probability: 5,
        obtainable: false,
        description: "Applies Cloudtouched mutations to nearby fruits",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 486;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(40, adjustedBaseSeconds - (4 * kg));
            const mutateChance = 15 + (kg / 20);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Every <strong>${Utils.formatTime(seconds)}</strong>, <strong>${mutateChance.toFixed(2)}%</strong> chance to mutate a nearby fruit, applying the Cloudtouched mutation!${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases mutation time by 4 seconds and increases mutation chance by 0.05%"
    },
    axolotl: {
        name: "Axolotl",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/0/0f/AxolotlIcon.png",
            fallback: "🦎"
        },
        type: "aquatic",
        rarity: "Mythical",
        source: "Oasis Egg",
        probability: 15,
        obtainable: false,
        description: "Preserves Summer type fruits after collecting",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const basePreserveChance = 6;
            const preserveChance = Math.min(13, basePreserveChance + (0.20 * kg));
            
            const preserveChanceMod = basePreserveChance * modifier;
            const preserveChanceTotal = preserveChance + preserveChanceMod;
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<strong>${preserveChanceTotal.toFixed(1)}%</strong> chance Summer type fruit stays after collecting${displayText}!`;
        },
        perKgImpact: () => "Each additional kg increases preservation chance by 0.20%"
    },
    sandsnake: {
        name: "Sand Snake",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/a/a4/SandSnakeIcon.png",
            fallback: "🐍"
        },
        type: "reptile",
        rarity: "Legendary",
        source: "Oasis Egg",
        probability: 34.5,
        obtainable: false,        
        description: "Duplicates purchased items from seed/gear shop",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const duplicateChance = 1 + (kg / 4);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `Buying from the seed/gear shop has a <strong>${duplicateChance.toFixed(2)}%</strong> chance to duplicate the bought item!${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases item duplication chance by 0.25%"
    }
};

module.exports = { OASIS_EGG_PETS };
