const { OwnerID } = require('../../../config.json');
module.exports = {
  name: 'reload',
  aliases: ['rl'],
  description: 'Reload a command file (developer).',
  usage: 'reload <commandName>',
  cooldownTime: '2',
  group: 'developer',
  botPermissions: ['none'],
  run: async (bot, prefix, message, args) => {
    if(message.author.id !== OwnerID) return;
    if(!args.length) return message.reply('Specify a command to reload.');
    const target = args[0].toLowerCase();
    const cmd = bot.commands.get(target) || bot.commands.get(bot.aliases.get(target));
    if(!cmd) return message.reply('Command not found.');
    try {
      // Attempt to resolve path from existing command object if it stored a path
      let filePath = cmd.filePath;
      if(!filePath){
        // naive search: iterate commands map values for exact name match and pick first with filePath
        for(const c of bot.commands.values()){
          if(c.name === cmd.name && c.filePath){ filePath = c.filePath; break; }
        }
      }
      if(!filePath) return message.reply('Original file path not stored; reload not supported.');
      delete require.cache[require.resolve(filePath)];
      const fresh = require(filePath);
      fresh.filePath = filePath; // persist path
      bot.commands.set(fresh.name, fresh);
      message.reply(`Reloaded ${fresh.name}.`);
    } catch(e){
      message.reply('Reload failed: '+e.message);
    }
  }
};
