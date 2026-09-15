// Utility functions for pet modifier calculations (CommonJS)

// Utility function for modifier calculations
const getModifierDetails = (modifierType) => {
    switch(modifierType) {
        case "golden":
            return { value: 0.1, text: "[+Golden]", style: "color: gold;" };
        case "rainbow":
            return { value: 0.2, text: "[+Rainbow]", style: "background: linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" };
        case "shocked":
            return { value: 0, text: "[+Shocked]", style: "color: rgb(255, 255, 100);" };
        case "frozen":
            return { value: 0, text: "[+Frozen]", style: "color: rgb(108, 184, 255);" };
        case "windy":
            return { value: 0, text: "[+Windy]", style: "color: rgb(162, 185, 209);" };
        case "ironskin":
            return { value: 0, text: "[+IronSkin]", style: "color: rgb(206, 206, 206);" };
        case "radiant":
            return { value: 0, text: "[+Radiant]", style: "color: rgb(248, 108, 38);" };
        case "ascended":
            return { value: 0, text: "[+Ascended]", style: "color: rgb(247, 245, 184);" };
        case "tranquil":
            return { value: 0, text: "[+Tranquil]", style: "color: rgb(247, 245, 184);" };
        case "corrupted":
            return { value: 0, text: "[+Corrupted]", style: "color: rgb(247, 184, 184);" };
        default:
            return { value: 0, text: "", style: "" };
    }
};

// Utility function to get pet mutation description
const getPetMutationDescription = (modifierType, kg = 50) => {
    // Note: This function will need to be called after mutations are loaded
    // For now, returning empty string to avoid circular dependency issues
    // TODO: Implement proper async loading or restructure to avoid circular deps
    return "";
};

module.exports = { getModifierDetails, getPetMutationDescription };
