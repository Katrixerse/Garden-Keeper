const { startStockScheduler } = require("./schedule");

module.exports = {
    checkNewStock: (bot, guild) => {
        startStockScheduler(bot, guild);
    }
};