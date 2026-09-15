const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const { getLevel, calcNeededXP, getRankCardBackground, getBadges, getTitleForLevel, calcCumulativeXP } = require('../Handlers/leveling/levels');
const { BADGE_IMAGES } = require('../Handlers/leveling/badgeImages');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Rank card image')
    .setDMPermission(false)
    .addUserOption(o=>o.setName('user').setDescription('Target user').setRequired(false)),
  cooldownMs: 5000,
  async execute(interaction){
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    const { xp, level } = await getLevel(interaction.guild.id, user.id);
    const badges = await getBadges(interaction.guild.id, user.id);
    const title = getTitleForLevel(level);
    const next = calcNeededXP(level+1);
    const percent = Math.min(1, xp/next);

  const width = 900; const hasBadges = badges.length>0; const height = hasBadges ? 360 : 280;
  const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    function rrect(x,y,w,h,r){
      r = Math.min(r, h/2, w/2);
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
    }

    const bg = await getRankCardBackground(interaction.guild.id, user.id);
    async function paintPreset(name){
      switch(name){
        case 'forest':{
          const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#0f2027'); g.addColorStop(0.5,'#2c7744'); g.addColorStop(1,'#004e1f'); ctx.fillStyle=g; ctx.fillRect(0,0,width,height); break; }
        case 'dusk':{
          const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#355C7D'); g.addColorStop(0.5,'#6C5B7B'); g.addColorStop(1,'#C06C84'); ctx.fillStyle=g; ctx.fillRect(0,0,width,height); break; }
        case 'sunset':{
          const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#0B486B'); g.addColorStop(1,'#F56217'); ctx.fillStyle=g; ctx.fillRect(0,0,width,height); break; }
        case 'ocean':{
          const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#141E30'); g.addColorStop(1,'#243B55'); ctx.fillStyle=g; ctx.fillRect(0,0,width,height); break; }
        case 'midnight': default:{
          const g = ctx.createLinearGradient(0,0,width,height); g.addColorStop(0,'#0f2027'); g.addColorStop(0.5,'#203a43'); g.addColorStop(1,'#2c5364'); ctx.fillStyle=g; ctx.fillRect(0,0,width,height); break; }
      }
    }
    if(!bg){
      await paintPreset('midnight');
    } else if(bg.bg_type === 'preset'){
      await paintPreset(bg.bg_value || 'midnight');
    } else if(bg.bg_type === 'color'){
      ctx.fillStyle = bg.bg_value; ctx.fillRect(0,0,width,height);
    } else if(bg.bg_type === 'image'){
      try{ const img = await Canvas.loadImage(bg.bg_value); ctx.drawImage(img,0,0,width,height); } catch{ await paintPreset('midnight'); }
    }

    // Glass panel
  const panelMarginRight = 40; // dynamic panel height
  const panelX = 210, panelY = 25, panelW = width - panelX - panelMarginRight, panelH = height - 50;
    ctx.globalAlpha = 0.35; ctx.fillStyle='#ffffff'; rrect(panelX,panelY,panelW,panelH,28); ctx.fill();
    ctx.globalAlpha = 1; ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.18)'; rrect(panelX,panelY,panelW,panelH,28); ctx.stroke();

    // Avatar
  const centerA = 110, centerY = height/2; // shift avatar slightly left
    try { const av = user.displayAvatarURL({ extension:'png', size:256 }); const img = await Canvas.loadImage(av); ctx.beginPath(); ctx.arc(centerA,centerY,82,0,Math.PI*2); ctx.strokeStyle='#4caf50'; ctx.lineWidth=6; ctx.stroke(); ctx.save(); ctx.beginPath(); ctx.arc(centerA,centerY,76,0,Math.PI*2); ctx.closePath(); ctx.clip(); ctx.drawImage(img,centerA-76,centerY-76,152,152); ctx.restore(); } catch {}

    // Text
  const contentLeft = panelX + 40; let y = panelY + 68; // tweak starting Y
    ctx.font='700 42px Sans'; ctx.fillStyle='#ffffff';
    let uname = user.username; const maxNameWidth = panelX + panelW - contentLeft - 40; while(ctx.measureText(uname).width > maxNameWidth){ if(uname.length<=3) break; uname = uname.slice(0,-4)+'…'; }
    ctx.fillText(uname, contentLeft, y);
    ctx.font='italic 26px Sans'; ctx.fillStyle='#e5f8d5'; ctx.fillText(title, contentLeft, y+34);
  y += 88; // more space after title
    ctx.font='24px Sans'; ctx.fillStyle='#d1d5db'; const needed = next - xp; ctx.fillText(`Level ${level} • ${xp.toLocaleString()} / ${next.toLocaleString()} XP ( ${needed.toLocaleString()} to next )`, contentLeft, y);
  // Total XP line
  const totalXP = calcCumulativeXP(level, xp);
  y += 40;
    ctx.font='22px Sans'; ctx.fillStyle='#bcd7c2'; ctx.fillText(`Total XP: ${totalXP.toLocaleString()}`, contentLeft, y);
  y += 30; // space before progress bar
    const barX=contentLeft, barY=y, barW=panelX+panelW-contentLeft-40, barH=38;
    // Background pill
    ctx.globalAlpha=0.25; ctx.fillStyle='#ffffff'; rrect(barX,barY,barW,barH, barH/2); ctx.fill(); ctx.globalAlpha=1;
    // Clip to container for fill to avoid overflow rounding artifacts
    ctx.save(); rrect(barX,barY,barW,barH,barH/2); ctx.clip();
    const fillWidth = Math.floor(barW*percent);
    if(fillWidth>0){
      const fillGrad=ctx.createLinearGradient(barX,barY,barX+barW,barY); fillGrad.addColorStop(0,'#56ab2f'); fillGrad.addColorStop(1,'#a8e063'); ctx.fillStyle=fillGrad; const dynRadius=Math.min(barH/2, fillWidth/2); rrect(barX,barY,fillWidth,barH,dynRadius); ctx.fill();
    }
    ctx.restore();
    ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.4)'; rrect(barX,barY,barW,barH,barH/2); ctx.stroke();
    ctx.font='700 20px Sans'; ctx.fillStyle='#ffffff'; const pctTxt=(percent*100).toFixed(1)+'%'; const txtW=ctx.measureText(pctTxt).width; ctx.fillText(pctTxt, barX+(barW-txtW)/2, barY+barH/2+7);
    ctx.font='16px Sans'; ctx.fillStyle='#9ca3af'; ctx.fillText(`ID: ${user.id}`, contentLeft, barY+barH+28);
  if(badges.length){ const badgeY=barY+barH+22; const size=52; const gap=12; const maxPerRow=Math.floor((panelX+panelW-contentLeft-40)/(size+gap)); const show=badges.slice(0,maxPerRow); for(let i=0;i<show.length;i++){ const key=show[i]; const bx=contentLeft+i*(size+gap); const src=BADGE_IMAGES[key]; if(src){ try{ const img=await Canvas.loadImage(src); ctx.drawImage(img,bx,badgeY,size,size); }catch{} } else { ctx.fillStyle='rgba(255,255,255,0.15)'; rrect(bx,badgeY,size,size,12); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=2; rrect(bx,badgeY,size,size,12); ctx.stroke(); ctx.font='600 14px Sans'; ctx.fillStyle='#ffffff'; const label=key.slice(0,6); const tw=ctx.measureText(label).width; ctx.fillText(label, bx+(size-tw)/2, badgeY+size/2+5); } } }

    const attachment = new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'rank.png' });
    await interaction.editReply({ files:[attachment] });
  }
};
