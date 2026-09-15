const Canvas = require('canvas');
const path = require('path');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { getWelcomeSettings } = require('../../Handlers/dbHandlers/welcomeSettings.js');
const { getCaptchaSettings, createPending, deleteForUser } = require('../../Handlers/dbHandlers/captchaSettings.js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  /**
   * @param {import('discord.js').Client} bot
   * @param {import('discord.js').GuildMember} member
   */
  async execute(bot, member){
    try {
      if(!member || !member.guild) return;
      const settings = await getWelcomeSettings(member.guild.id);

      // Captcha: create pending if enabled
      try {
        const cap = await getCaptchaSettings(member.guild.id);
        if(cap.enabled && cap.roleId){
          // Clean stale pending for this user
          await deleteForUser(member.guild.id, member.id);
          // Simple challenge: 5 letter code (A-Z)
            const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let challenge = '';
            for(let i=0;i<5;i++) challenge += letters[Math.floor(Math.random()*letters.length)];
            const token = crypto.randomBytes(20).toString('hex');
            const answerHash = crypto.createHash('sha256').update(challenge).digest('hex');
            await createPending({ token, guildId: member.guild.id, userId: member.id, challenge, answerHash });
            const verifyUrl = `https://katrixerse.com/garden-keeper/verify?token=${token}`; // TODO: config base URL
            member.send(`Welcome to **${member.guild.name}**! Please complete this verification within 10 minutes.\nCode: **${challenge}**\nSubmit here: ${verifyUrl}`).catch(()=>{});
        }
      } catch(e){ console.warn('captcha create error', e?.message||e); }
      if(!settings.enabled || !settings.channelId) return;
      const channel = member.guild.channels.cache.get(settings.channelId);
      if(!channel || !channel.isTextBased()) return;

      // Canvas setup
      const width = 900, height = 300;
      const canvas = Canvas.createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Background
      if(settings.backgroundUrl){
        try {
          const bg = await Canvas.loadImage(settings.backgroundUrl);
          ctx.drawImage(bg,0,0,width,height);
        } catch { fillGradient(); }
      } else fillGradient();

      function fillGradient(){
        const g = ctx.createLinearGradient(0,0,width,height);
        g.addColorStop(0,'#1d4624');
        g.addColorStop(1,'#2e7d32');
        ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
      }

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 6; ctx.strokeRect(3,3,width-6,height-6);

      // Avatar
      const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 256 });
      let avatarImg = null;
      try { avatarImg = await Canvas.loadImage(avatarURL); } catch {}
      const AV_SIZE = 180;
      ctx.save();
      ctx.beginPath();
      ctx.arc(AV_SIZE/2 + 60, height/2, AV_SIZE/2, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      if(avatarImg) ctx.drawImage(avatarImg, 60, height/2 - AV_SIZE/2, AV_SIZE, AV_SIZE);
      ctx.restore();

      // Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '50px Sans';
      const welcomeText = 'Welcome';
      ctx.fillText(welcomeText, 300, 140);
      ctx.font = 'bold 48px Sans';
      const username = member.user.username.length > 16 ? member.user.username.slice(0,16)+'…' : member.user.username;
      ctx.fillText(username, 300, 200);

      ctx.font = '26px Sans';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(`Member #${member.guild.memberCount}`, 300, 240);

      // Custom message (below image via embed)
      const rawTemplate = (settings.messageTemplate || 'Welcome to the server, {mention}!');
      const compiled = rawTemplate.replace(/\{username\}/gi, member.user.username)
        .replace(/\{tag\}/gi, member.user.tag)
        .replace(/\{id\}/gi, member.user.id)
        .replace(/\{mention\}/gi, `<@${member.user.id}>`)
        .replace(/\{memberCount\}/gi, String(member.guild.memberCount));

      const buffer = canvas.toBuffer('image/png');
      const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });

      const embed = new EmbedBuilder()
        .setDescription(compiled)
        .setColor(0x2e7d32)
        .setImage('attachment://welcome.png')
        .setFooter({ text: member.guild.name })
        .setTimestamp();

      await channel.send({ content: compiled.includes('{mention}') ? undefined : `<@${member.id}>`, embeds:[embed], files:[attachment] });
    } catch(err){
      console.error('guildMemberAdd welcome error:', err?.message||err);
    }
  }
};
