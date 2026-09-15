// Common calculation utilities for pets (CommonJS)
const { getModifierDetails } = require('./modifiers.js');

/**
 * Utility functions for pet calculations
 */
const Utils = {
    isValidWeight: (kg) => {
        return typeof kg === 'number' && kg >= 0 && kg <= 1000;
    },
    
    formatTime: (seconds) => {
        if (seconds < 60) {
            return `${Math.round(seconds)}s`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const remainingMinutes = Math.floor((seconds % 3600) / 60);
            return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
        }
    },
    
    formatNumber: (num) => {
        return num.toLocaleString();
    }
};

/**
 * Apply time-based modifier calculations
 */
const applyTimeModifier = (baseSeconds, kg, secondsPerKg, modifier, minSeconds = 1) => {
    const secondsMod = baseSeconds * modifier;
    const adjustedBase = baseSeconds - secondsMod;
    return Math.max(minSeconds, adjustedBase - (secondsPerKg * kg));
};

/**
 * Apply value-based modifier calculations
 */
const applyValueModifier = (baseValue, kg, valuePerKg, modifier) => {
    const value = baseValue + (valuePerKg * kg);
    const modValue = baseValue * modifier;
    return value + modValue;
};

/**
 * Format modifier display text
 */
const formatModifierDisplay = (modifier, modifierText, modifierStyle) => {
    return modifier > 0 ? ` <span style='${modifierStyle}'>${modifierText}</span>` : "";
};

/**
 * Standard feeding pet calculation
 */
const createFeedingCalculation = (config) => {
    return (kg, modifierType = "none") => {
        if (!Utils.isValidWeight(kg)) return "Invalid weight";
        
        const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
        
        const seconds = applyTimeModifier(
            config.baseSeconds, 
            kg, 
            config.secondsPerKg || 1, 
            modifier, 
            config.minSeconds || 1
        );
        
        const bonus = applyValueModifier(
            config.baseBonus, 
            kg, 
            config.bonusPerKg || 0, 
            modifier
        );
        
        const displayText = formatModifierDisplay(modifier, modifierText, modifierStyle);
        
        return config.formatResult(seconds, bonus, displayText);
    };
};

/**
 * Experience gain pet calculation  
 */
const createExperienceCalculation = (config) => {
    return (kg, modifierType = "none") => {
        if (!Utils.isValidWeight(kg)) return "Invalid weight";
        
        const { value: modifier, text: modifierText, style: modifierStyle } = getModifierDetails(modifierType);
        
        const experience = applyValueModifier(
            config.baseExperience, 
            kg, 
            config.experiencePerKg || 0, 
            modifier
        );
        
        const displayText = formatModifierDisplay(modifier, modifierText, modifierStyle);
        
        return config.formatResult(experience, displayText);
    };
};

module.exports = {
    Utils,
    applyTimeModifier,
    applyValueModifier,
    formatModifierDisplay,
    createFeedingCalculation,
    createExperienceCalculation
};
