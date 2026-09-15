const request = require('node-superfetch');
const dayjs = require('dayjs');
const { listAll, setLastVideoId } = require('../dbHandlers/youtubeAlerts.js');

const DEBUG = process.env.YT_ALERT_DEBUG === '1';

// Fetch channel uploads via RSS feed
// https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
async function fetchChannelFeed(ytChannelId){
  try {
    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(ytChannelId)}`;
    const res = await request.get(url).set('User-Agent','GardenKeeperBot/1.0');
    if(res.status !== 200){
      throw new Error('HTTP '+res.status);
    }
    // node-superfetch sets text / body
    return res.text || res.body;
  } catch(e){
    if(DEBUG) console.warn('[YouTubeWatcher] feed fetch failed', ytChannelId, e?.message||e);
    return null;
  }
}

function parseEntries(xml){
  // Extract all entries; non-greedy capture groups per entry
  // We purposefully avoid full XML parsing to keep dependencies minimal.
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
  let match;
  while((match = entryRegex.exec(xml))){
    const block = match[1];
    const idMatch = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i);
    const publishedMatch = block.match(/<published>([^<]+)<\/published>/i);
    const titleMatch = block.match(/<title>([^<]+)<\/title>/i);
    if(idMatch && publishedMatch && titleMatch){
      entries.push({
        videoId: idMatch[1],
        publishedIso: publishedMatch[1],
        title: titleMatch[1]
      });
    }
  }
  // Sort by published descending
  entries.sort((a,b)=> new Date(b.publishedIso) - new Date(a.publishedIso));
  return entries;
}

async function checkOnce(bot){
  const subs = await listAll();
  for(const sub of subs){
    try {
      const xml = await fetchChannelFeed(sub.ytChannelId);
      if(!xml) continue;
      const entries = parseEntries(xml);
      if(!entries.length) continue;
      const latest = entries[0];
      if(!latest.videoId) continue;

      if(sub.lastVideoId && sub.lastVideoId === latest.videoId){
        if(DEBUG) console.log('[YouTubeWatcher] No new video for', sub.ytChannelId);
        continue;
      }

      const guild = bot.guilds.cache.get(sub.guildId);
      if(!guild) continue;
      const channel = guild.channels.cache.get(sub.discordChannelId);
      if(!channel || !channel.isTextBased()) continue;

      // If this is the very first time (no lastVideoId) we set without sending to prevent backlog spam.
      if(!sub.lastVideoId){
        await setLastVideoId(sub.guildId, sub.ytChannelId, latest.videoId);
        if(DEBUG) console.log('[YouTubeWatcher] Initialized lastVideoId for', sub.ytChannelId, latest.videoId);
        continue;
      }

      const mention = sub.mentionRoleId ? `<@&${sub.mentionRoleId}> ` : '';
      const url = `https://youtu.be/${latest.videoId}`;
      const publishedRel = dayjs(latest.publishedIso).isValid() ? dayjs(latest.publishedIso).unix() : null;
      const msg = (sub.template || '{mention} New upload: {title} {url}')
        .replace(/\{mention\}/g, mention)
        .replace(/\{title\}/g, latest.title)
        .replace(/\{url\}/g, url)
        .replace(/\{published\}/g, publishedRel ? `<t:${publishedRel}:R>` : '')
        .trim();
      await channel.send({ content: msg });
      await setLastVideoId(sub.guildId, sub.ytChannelId, latest.videoId);
      if(DEBUG) console.log('[YouTubeWatcher] Posted alert for', sub.ytChannelId, latest.videoId);
    } catch(e){
      if(DEBUG) console.warn('[YouTubeWatcher] sub error', sub.ytChannelId, e?.message||e);
    }
  }
}

function startWatcher(bot){
  // run after ready; spacing 5 min
  const run = () => checkOnce(bot).catch(()=>{});
  setTimeout(run, 5000);
  const id = setInterval(run, 5*60*1000);
  return { stop: ()=>clearInterval(id) };
}

module.exports = { startWatcher, checkOnce };
