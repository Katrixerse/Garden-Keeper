const { getReactionRolesForMessage } = require('../../Handlers/dbHandlers/reactionRoles');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  /**
   * @param {import('discord.js').Client} bot
   * @param {import('discord.js').MessageReaction} reaction
   * @param {import('discord.js').User} user
   */
  async execute(bot, reaction, user){
    try {
      if(user.bot) return;
      if(reaction.partial){
        try { await reaction.fetch(); } catch { return; }
      }
      const msg = reaction.message;
      if(!msg.guild) return;
      const entries = await getReactionRolesForMessage(msg.guild.id, msg.id);
      if(!entries.length) return;
      const match = entries.find(e => e.emoji === reaction.emoji.identifier || e.emoji === reaction.emoji.name);
      if(!match) return;
      const member = await msg.guild.members.fetch(user.id).catch(()=>null);
      if(!member) return;
      if(!member.roles.cache.has(match.roleId)) return; // no role
      await member.roles.remove(match.roleId, 'Reaction role remove').catch(()=>{});
    } catch(err){
      console.error('messageReactionRemove handler error:', err?.message||err);
    }
  }
};
