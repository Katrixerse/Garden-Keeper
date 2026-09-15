const request = require("node-superfetch");
const { statusHandler } = require("./status");
const { setAllStock } = require("./state");
const { formatStock, formatEggStock, formatEventStock, formatCosmeticStock, formatMerchantStock, formatWeather, formatForeverPack, formatAdminMessages, formatStockPrediction } = require("./formatters");
const { gagAPIKey, gkAPIKey } = require("../../../config.json");

// Fetch and process store stock
async function fetchAPI(bot) {
    try {
        let res;
        // Use internal website proxy
        res = await request
            .get(`https://katrixerse.com/garden-keeper/api/stock`)
            .set("x-api-key", gkAPIKey)
            .query({ force: "true" });
        if (res.ok === false && res.status !== 200) {
            // Direct upstream fallback
            res = await request
                .get("https://api.joshlei.com/v2/growagarden/stock")
                .set("jstudio-key", gagAPIKey);
        }
        if (res.status === 401) {
            console.warn('[Stock] 401 Unauthorized from website API. Check API_KEYS env on website and GKPR_API_KEY in bot.');
        }

        statusHandler(bot, bot.guilds.cache.get("1392233149630648533"), res.status);

        if (!res.ok || res.status !== 200 || !res.body) {
            setAllStock();
            return { ok: false, status: res.status ?? 0 };
        }

        await formatStock(bot, res.body);
        await formatEggStock(res.body);
        await formatEventStock(res.body);
        await formatCosmeticStock(res.body);
        await formatMerchantStock(res.body);

        return { ok: true, status: 200 };
    } catch (error) {
        const code = error?.status ?? "ERR";
        statusHandler(bot, bot.guilds.cache.get("1392233149630648533"), code);
        setAllStock();
        return { ok: false, status: code };
    }
}

// Fetch and process weather
async function fetchWeatherAPI() {
    try {
        let res;
        // Use internal website proxy
        res = await request
            .get(`https://katrixerse.com/garden-keeper/api/weather`)
            .set("x-api-key", gkAPIKey);
        if (res.ok === false && res.status !== 200) {
            // Direct upstream fallback
            res = await request
                .get("https://api.joshlei.com/v2/growagarden/weather")
                .set("jstudio-key", gagAPIKey);
        }
        if (res.status === 401) {
            console.warn('[Weather] 401 Unauthorized from website API. Check API_KEYS env on website and GKPR_API_KEY in bot.');
        }

        if (!res.ok || res.status !== 200 || !res.body) {
            return { ok: false, status: res.status ?? 0 };
        }

        await formatWeather(res.body);
        return { ok: true, status: 200 };
    } catch (error) {
        console.error(`Error fetching weather data: ${error?.message || error}`);
        return { ok: false, status: error?.status ?? "ERR" };
    }
}

async function fetchForeverpackAPI() {
    try {
        let res;
        // Use internal website proxy
        res = await request
            .get(`https://katrixerse.com/garden-keeper/api/foreverpack`)
            .set("x-api-key", gkAPIKey);
        if (res.status === 401) {
            console.warn('[ForeverPack] 401 Unauthorized from website API. Check API_KEYS env on website and GKPR_API_KEY in bot.');
        }

        if (!res.ok || res.status !== 200 || !res.body) {
            return { ok: false, status: res.status ?? 0 };
        }

        await formatForeverPack(res.body);
        return { ok: true, status: 200, body: res.body };
    } catch (error) {
        console.error(`Error fetching foreverpack data: ${error?.message || error}`);
        return { ok: false, status: error?.status ?? "ERR" };
    }
};

async function fetchAdminMessagesAPI() {
        try {
        let res;
        // Use internal website proxy
        res = await request
            .get(`https://katrixerse.com/garden-keeper/api/AdminMessage`)
            .set("x-api-key", gkAPIKey);
        if (res.status === 401) {
            console.warn('[AdminMessages] 401 Unauthorized from website API. Check API_KEYS env on website and GKPR_API_KEY in bot.');
        }

        if (!res.ok || res.status !== 200 || !res.body) {
            return { ok: false, status: res.status ?? 0 };
        }

    await formatAdminMessages(res.body);
        return { ok: true, status: 200 };
    } catch (error) {
        console.error(`Error fetching admin messages data: ${error?.message || error}`);
        return { ok: false, status: error?.status ?? "ERR" };
    }
}

async function fetchStockPrediction(params) {
    try {
        let res;
        // Use internal website proxy
        res = await request
            .get(`https://katrixerse.com/garden-keeper/api/stock/predict`)
            .set("x-api-key", gkAPIKey);
        if (res.status === 401) {
            console.warn('[StockPrediction] 401 Unauthorized from website API. Check API_KEYS env on website and GKPR_API_KEY in bot.');
        }

        if (!res.ok || res.status !== 200 || !res.body) {
            return { ok: false, status: res.status ?? 0 };
        }

        await formatStockPrediction(res.body);
        return { ok: true, status: 200 };
    } catch (error) {
        console.error(`Error fetching stock prediction data: ${error?.message || error}`);
        return { ok: false, status: error?.status ?? "ERR" };
    }
}

module.exports = { fetchAPI, fetchWeatherAPI, fetchForeverpackAPI };