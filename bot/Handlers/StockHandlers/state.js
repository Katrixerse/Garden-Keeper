const state = {
    // Raw formatted sections (always hold latest full text)
    SeedStock: "",
    EggStock: "",
    GearStock: "",
    eventStock: "",
    cosmeticStock: "",
    travelingMerchantStock: "",
    foreverPackStock: "",
    // Public diff-aware exposed sections (set to new value or "no new stock")
    storeStock: "",
    storeEggStock: "",
    storeEventStock: "",
    storeCosmeticStock: "",
    storeTravelingMerchantStock: "",
    // Role caches
    pingRoles: [],
    pingEggRoles: [],
    lastSeenTime: {},
    // Cache metadata (hash + timestamps)
    cache: {
        storeStock: { hash: null, lastUpdated: 0, lastChanged: 0 },
        storeEggStock: { hash: null, lastUpdated: 0, lastChanged: 0 },
        storeEventStock: { hash: null, lastUpdated: 0, lastChanged: 0 },
        storeCosmeticStock: { hash: null, lastUpdated: 0, lastChanged: 0 },
        storeTravelingMerchantStock: { hash: null, lastUpdated: 0, lastChanged: 0 }
        ,storeForeverPackStock: { hash: null, lastUpdated: 0, lastChanged: 0 }
    }
};

const weatherState = {
    events: [],
    eventEnds: {},
    pingWeatherRoles: [],
    lastSignature: "",
    lastEventNames: [], // names of events from last sent embed (for multi->single suppression)
    emptyCycles: 0 // consecutive fetch cycles with zero events (used to debounce resets)
};

function simpleHash(str) {
    // Fast non-cryptographic hash (32-bit unsigned)
    let h = 0; if (!str) return 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h >>> 0;
}

function normalize(val){
    if(val == null) return '';
    return String(val);
}

function updateCachedSection(sectionKey, newValue, hashSource) {
    const meta = state.cache[sectionKey];
    if (!meta) return { changed: false, value: state[sectionKey] };
    const now = Date.now();
    const trimmed = normalize(newValue).trim();
    const canonical = hashSource !== undefined ? normalize(hashSource).trim() : trimmed;
    const hash = simpleHash(canonical);
    meta.lastUpdated = now;
    if (meta.hash === hash) {
        // unchanged -> expose sentinel while keeping original raw (raw kept separately before calling this)
        state[sectionKey] = "no new stock";
        return { changed: false, value: state[sectionKey] };
    }
    meta.hash = hash;
    meta.lastChanged = now;
    state[sectionKey] = trimmed || "no new stock"; // if becomes empty still show sentinel
    return { changed: true, value: state[sectionKey] };
}

function setAllStock() {
    Object.keys(state.cache).forEach(k => {
        state[k] = "no new stock";
        const meta = state.cache[k];
        if (meta) { meta.lastUpdated = Date.now(); }
    });
}

module.exports = { state, weatherState, setAllStock, updateCachedSection };