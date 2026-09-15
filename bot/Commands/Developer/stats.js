const os = require('os');
const ms = require('ms');
const { OwnerID } = require('../../../config.json');

module.exports = {
  name: 'devstats',
  aliases: ['dstats'],
  description: 'Developer runtime stats.',
  usage: 'devstats',
  cooldownTime: '5',
  group: 'developer',
  botPermissions: ['none'],
  run: async (bot, prefix, message) => {
    if(message.author.id !== OwnerID) return;
    const mem = process.memoryUsage();
    const rss = (mem.rss / 1024 / 1024).toFixed(1);
    const heap = (mem.heapUsed / 1024 / 1024).toFixed(1);
    const load = os.loadavg ? os.loadavg().map(n=>n.toFixed(2)).join(', ') : 'n/a';
    message.channel.send('```\n'+
      `Uptime: ${ms(bot.uptime)}\n`+
      `Guilds: ${bot.guilds.cache.size}\n`+
      `Users: ${bot.users.cache.size}\n`+
      `RSS: ${rss} MB\n`+
      `Heap: ${heap} MB\n`+
      `Load: ${load}\n`+
      `Node: ${process.version}\n`+
    '```');
  }
};
