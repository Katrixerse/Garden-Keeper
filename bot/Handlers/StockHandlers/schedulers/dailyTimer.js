// Generic daily timer at a specific hour:minute (24h) local server time.
function scheduleDailyAt(hour, minute, callback, label) {
  function computeDelay() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(hour, minute, 0, 100); // slight 100ms offset
    if (target <= now) target.setDate(target.getDate() + 1);
    return target.getTime() - now.getTime();
  }
  function run() {
    callback();
    setTimeout(run, 24 * 60 * 60 * 1000);
  }
  const delay = computeDelay();
  console.log(`[DailyTimer] Scheduling ${label || 'task'} in ${Math.round(delay/1000)} seconds.`);
  setTimeout(run, delay);
}

function startDaily801Timer(callback) {
  scheduleDailyAt(20, 1, callback, '20:01 task');
}

module.exports = { scheduleDailyAt, startDaily801Timer };
