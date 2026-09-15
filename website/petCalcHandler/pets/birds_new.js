const { getModifierDetails } = require('../utils/modifiers.js');
const { Utils } = require('../utils/calculations.js');

const birdPets = {

    kiwi: {
        name: "Kiwi",
        icon: {
            type: "image",
            url: "https://static.wikia.nocookie.net/growagarden/images/e/ea/Kiwi.png",
            fallback: "🥝"
        },
        type: "bird",
        rarity: "Rare",
        description: "Reduces egg hatch times",
        calculate: (kg, modifierType = "none") => {
            if (!Utils.isValidWeight(kg)) return "Invalid weight";
            
            const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
            
            const baseSeconds = 60;
            const secondsMod = baseSeconds * modifier;
            const adjustedBaseSeconds = baseSeconds - secondsMod;
            const seconds = Math.max(1, adjustedBaseSeconds - kg);
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
    }
};

module.exports = { birdPets };
