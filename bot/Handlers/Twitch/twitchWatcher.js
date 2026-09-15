const { listAll, setLastStreamId } = require('../dbHandlers/twitchAlerts.js');
const { getStreams } = require('./twitchApi.js');
const { EmbedBuilder } = require('discord.js');

const DEBUG = process.env.TWITCH_ALERT_DEBUG === '1';

async function checkOnce(bot){
  const subs = await listAll();
  if(!subs.length) return;
  // Batch by 100 user ids (Twitch limit)
  const chunks = [];
  for(let i=0;i<subs.length;i+=100) chunks.push(subs.slice(i,i+100));
  for(const chunk of chunks){
    const userIds = chunk.map(s=>s.twitchUserId);
    let streams=[];
    try { streams = await getStreams(userIds); } catch { continue; }
    const liveMap = new Map(streams.map(s=>[s.user_id, s]));
    for(const sub of chunk){
      const live = liveMap.get(sub.twitchUserId);
      if(!live) continue; // not live
      if(sub.lastStreamId && sub.lastStreamId === live.id) continue; // already alerted

      // Resolve guild & channel
      const guild = bot.guilds.cache.get(sub.guildId); if(!guild) continue;
      const ch = guild.channels.cache.get(sub.discordChannelId); if(!ch || !ch.isTextBased()) continue;

      // First-time initialization: store current stream id without posting to avoid retroactive spam
      if(!sub.lastStreamId){
        await setLastStreamId(sub.guildId, sub.twitchUserId, live.id).catch(()=>{});
        if(DEBUG) console.log('[TwitchWatcher] Initialized lastStreamId for', sub.twitchUserId, live.id);
        continue;
      }

      const mention = sub.mentionRoleId ? `<@&${sub.mentionRoleId}> ` : '';
      const url = `https://twitch.tv/${live.user_login}`;
      const thumb = live?.thumbnail_url ? live.thumbnail_url.replace('{width}x{height}', '1280x720') : null;

      const twitchEmbed = new EmbedBuilder()
        .setTitle(`${live.user_login} is now live!`)
        .setDescription(live.title || 'Streaming now')
        .setURL(url)
        .setColor(0x9146FF)
        .setTimestamp();
      if(thumb) twitchEmbed.setImage(thumb);

      try {
        if (mention) {
          await ch.send({ content: mention.trim(), embeds: [twitchEmbed], allowedMentions: { roles: [sub.mentionRoleId], parse: [] } });
        } else {
          await ch.send({ embeds: [twitchEmbed] });
        }
        await setLastStreamId(sub.guildId, sub.twitchUserId, live.id).catch(()=>{});
        if(DEBUG) console.log('[TwitchWatcher] Posted alert for', sub.twitchUserId, live.id);
      } catch(e){
        if(DEBUG) console.warn('[TwitchWatcher] send error', sub.twitchUserId, e?.message||e);
      }
    }
  }
}

function startTwitchWatcher(bot){
  const run = ()=> checkOnce(bot).catch(()=>{});
  setTimeout(run, 8000);
  const id = setInterval(run, 2*60*1000);
  return { stop: ()=>clearInterval(id) };
}

module.exports = { startTwitchWatcher, checkOnce };
