const { state, weatherState } = require("./state");

function normalizeName(raw) {
    return String(raw)
        .replace(/\[[^\]]*]/g, "")     // remove [last seen: ...]
        .replace(/\s*x\s*\d+\s*$/i, "") // remove trailing " x123"
        .replace(/\d+/g, "")           // remove any stray digits
        .trim();
}

async function handleRoles(bot, guild) {
    const ids = new Set();
    const lines = (state.storeStock || "").split("\n");

    for (const line of lines) {
        const name = normalizeName(line);
        if (!name || name === "no new stock") continue;

        // skip common non-alert items
        const skip = [
            "Carrot", "Strawberry", "Blueberry",
            "Recall Wrench", "Favorite Tool", "Harvest Tool",
            "Trowel", "Cleaning Spray", "Basic Sprinkler"
        ];
        if (skip.some(s => s.toLowerCase() === name.toLowerCase())) continue;

        const role = guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (role) ids.add(role.id);
    }

    state.pingRoles = [...ids];
}

async function handleEggRoles(bot, guild) {
    const ids = new Set();
    const lines = (state.storeEggStock || "").split("\n");

    for (const line of lines) {
        const name = normalizeName(line);
        if (!name || name === "no new stock") continue;

        const skip = ["Common Egg", "Common Summer Egg"];
        if (skip.some(s => s.toLowerCase() === name.toLowerCase())) continue;

        const role = guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());
        if (role) ids.add(role.id);
    }

    state.pingEggRoles = [...ids];
}

async function handleWeatherRoles(bot, guild) {
    const events = Array.isArray(weatherState.events) ? weatherState.events : [];
    if(!events.length){
        weatherState.pingWeatherRoles = [];
        return;
    }
    const roleToPing = new Set();
    const skip = ["Windy", "Raining", "Frost", "KitchenStorm"]; // common events ignored
    const adminEvents = ["DJJhai", "Disco", "JandelStorm", "SheckleRain", "ChocolateRain", "LazerStorm", "Blackhole", "FloatingJandel", "Volcano", "MeteorStrike", "AlienInvasion", "SpaceTravel", "UnderTheSea", "JandelZombie", "JandelKatana"]; 
    const adminLower = adminEvents.map(e=>e.toLowerCase());

    for(const ev of events){
        const name = normalizeName(ev?.name || ev?.weather_name || '');
        if(!name) continue;
        if(skip.some(s => s.toLowerCase() === name.toLowerCase())) continue;
        if(adminLower.includes(name.toLowerCase())){
            const adminRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'admin event');
            if(adminRole) roleToPing.add(adminRole.id);
            continue;
        }
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === name.toLowerCase());
        if(role) roleToPing.add(role.id);
    }
    weatherState.pingWeatherRoles = [...roleToPing];
}

module.exports = { handleRoles, handleEggRoles, handleWeatherRoles };