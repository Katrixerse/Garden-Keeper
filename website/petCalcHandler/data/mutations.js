// Pet mutation options (CommonJS)
const { getModifierDetails } = require('../utils/modifiers.js');
const Utils = require('../utils/calculations.js');

const petMutationOptions = {
    "Shocked Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 60;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(45, adjustedCooldown - (0.6 * kg));
            
            const baseChance = 25;
            const chanceBonus = 0.02 * kg;
            const chance = Math.min(30, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(255, 255, 100)">SHOCKED: During a Thunderstorm: Every <strong>${cooldown.toFixed(1)}s</strong>, has a <strong>${chance.toFixed(2)}%</strong> chance to attract lightning, shocking nearby fruits!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 0.6 seconds and increases lightning chance by 0.02%"
    },
    "Frozen Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 300;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(30, adjustedCooldown - (3 * kg));
            
            const baseChance = 20;
            const chanceBonus = 0.03 * kg;
            const chance = Math.min(30, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(108, 184, 255)">FROZEN: Every <strong>${Utils.formatTime(cooldown)}</strong>, <strong>${chance.toFixed(2)}%</strong> chance a nearby fruit becomes Frozen!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 3 seconds and increases freeze chance by 0.03%"
    },
    "Windy Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 300;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(30, adjustedCooldown - (3 * kg));
            
            const baseChance = 20;
            const chanceBonus = 0.03 * kg;
            const chance = Math.min(30, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(162, 185, 209)">WINDY: Every <strong>${Utils.formatTime(cooldown)}</strong>, <strong>${chance.toFixed(2)}%</strong> chance a nearby fruit becomes Windstruck!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases cooldown by 3 seconds and increases windstruck chance by 0.03%"
    },
    "IronSkin Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseChance = 35;
            const chanceBonus = 0.2 * kg;
            const chance = Math.min(45, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(206, 206, 206)">IRONSKIN: When another player steals fruit from you, grants a <strong>${chance.toFixed(2)}%</strong> chance you get the stolen fruit as well!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg increases protection chance by 0.2%"
    },
    "Radiant Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 1800;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(1200, adjustedCooldown - (9 * kg));
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(248, 108, 38)">RADIANT: Every <strong>${Utils.formatTime(cooldown)}</strong>, emits sunshine at a random nearby plant and advances their growth by 24 hours!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases sunshine cooldown by 9 seconds"
    },
    "Ascended Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 21621;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(18000, adjustedCooldown - (21 * kg));
            
            const baseChance = 75;
            const chanceBonus = 0.03 * kg;
            const chance = Math.min(90, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(247, 245, 184)">ASCENDED: Every <strong>${Utils.formatTime(cooldown)}</strong>, a nearby fruit ascends to a higher realm, applying the Dawnbound mutation with <strong>${chance.toFixed(2)}%</strong> success rate!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases ascension cooldown by 21 seconds and increases success rate by 0.03%"
    },
    "Tranquil Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 1500;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(1000, adjustedCooldown - (3 * kg));
            
            const baseChance = 20;
            const chanceBonus = 0.03 * kg;
            const chance = Math.min(30, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgb(247, 245, 184)">TRANQUIL: Every <strong>${Utils.formatTime(cooldown)}</strong>, a nearby fruit finds inner peace, applying the Tranquil mutation with <strong>${chance.toFixed(2)}%</strong> success rate!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases tranquility cooldown by 3 seconds and increases success rate by 0.03%"
    },
    "Corrupted Pet Mutation": {
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseCooldown = 1500;
            const cooldownMod = baseCooldown * modifier;
            const adjustedCooldown = baseCooldown - cooldownMod;
            const cooldown = Math.max(1000, adjustedCooldown - (3 * kg));
            
            const baseChance = 20;
            const chanceBonus = 0.03 * kg;
            const chance = Math.min(30, baseChance + chanceBonus);
            
            const displayText = modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
            
            return `<font color="rgba(247, 184, 184, 1)">CORRUPTED: Every <strong>${Utils.formatTime(cooldown)}</strong>, a nearby fruit is corrupted, applying the Corrupted mutation with <strong>${chance.toFixed(2)}%</strong> success rate!</font>${displayText}`;
        },
        perKgImpact: () => "Each additional kg decreases tranquility cooldown by 3 seconds and increases success rate by 0.03%"
    }
};

module.exports = { petMutationOptions };
