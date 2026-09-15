const { startWeatherScheduler } = require("./schedule");

module.exports = {
    checkActiveWeather: (bot, guild) => {
        startWeatherScheduler(bot, guild);
    }
};