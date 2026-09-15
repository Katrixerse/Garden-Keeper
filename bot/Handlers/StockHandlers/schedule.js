// schedule.js acts as a thin backward-compat layer. Prefer importing specific
// scheduler modules directly (./schedulers/*) in new code.
const { startStockScheduler } = require('./schedulers/stockScheduler');
const { startWeatherScheduler } = require('./schedulers/weatherScheduler');
const { startForeverPackScheduler } = require('./schedulers/foreverPackScheduler');
const { startAdminMessagesScheduler } = require('./schedulers/adminMessagesScheduler');
const { startDailyStockPredictions } = require('./schedulers/predictionsScheduler');
const { startDaily801Timer: baseStartDaily801Timer } = require('./schedulers/dailyTimer');

module.exports = {
    startStockScheduler,
    startWeatherScheduler,
    startForeverPackScheduler,
    startAdminMessagesScheduler,
    startDailyStockPredictions,
    startDaily801Timer: legacyStartDaily801Timer
};
// Legacy wrapper kept for API compatibility (old signature bot,guild,task)
function legacyStartDaily801Timer(bot, guild, task){
  return baseStartDaily801Timer(() => task && task(bot, guild));
}
