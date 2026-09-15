const Canvas = require('canvas');
const { getTitleForLevel } = require('./levels');

/**
 * Generate a level up card buffer.
 * @param {import('discord.js').User} user
 * @param {number} oldLevel
 * @param {number} newLevel
 * @param {number} xpGain
 * @param {Object} opts optional style overrides
 * @returns {Promise<Buffer>} png buffer
 */
async function generateLevelUpCard(user, oldLevel, newLevel, xpGain, opts={}){
  const width = 700;
  const height = 250;
  const canvas = Canvas.createCanvas(width,height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  const g = ctx.createLinearGradient(0,0,width,height);
  g.addColorStop(0,'#0f2027');
  g.addColorStop(0.5,'#203a43');
  g.addColorStop(1,'#2c5364');
  ctx.fillStyle = g; ctx.fillRect(0,0,width,height);

  // Subtle noise overlay (optional future)
  // Glass panel
  function rrect(x,y,w,h,r){
    r = Math.min(r, h/2, w/2);
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);
    ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);
    ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);
    ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }
  ctx.globalAlpha=0.35; ctx.fillStyle='#ffffff'; rrect(20,20,width-40,height-40,28); ctx.fill();
  ctx.globalAlpha=1; ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.18)'; rrect(20,20,width-40,height-40,28); ctx.stroke();

  // Avatar
  try {
    const avatarURL = user.displayAvatarURL({ extension:'png', size:256 });
    const img = await Canvas.loadImage(avatarURL);
    const centerA = 120; const centerY = height/2;
    ctx.beginPath(); ctx.arc(centerA, centerY, 82,0,Math.PI*2); ctx.strokeStyle='#4caf50'; ctx.lineWidth=6; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(centerA, centerY, 76,0,Math.PI*2); ctx.clip();
    ctx.drawImage(img, centerA-76, centerY-76, 152, 152); ctx.restore();
  } catch{}

  const panelX = 220; const contentW = width - panelX - 40;
  let y = 70;
  ctx.font='700 46px Sans'; ctx.fillStyle='#ffffff';
  let uname = user.username; while(ctx.measureText(uname).width > contentW){ if(uname.length<=3) break; uname = uname.slice(0,-4)+'…'; }
  ctx.fillText(uname, panelX, y);

  // Title
  const title = getTitleForLevel(newLevel);
  ctx.font='italic 26px Sans'; ctx.fillStyle='#e5f8d5'; ctx.fillText(title, panelX, y+34);

  // Level up text
  y += 90;
  ctx.font='34px Sans'; ctx.fillStyle='#d1d5db';
  ctx.fillText(`Leveled Up!`, panelX, y);
  y += 54;
  // Level transition
  ctx.font='700 40px Sans'; ctx.fillStyle='#56ab2f';
  ctx.fillText(`Lv ${oldLevel} → Lv ${newLevel}`, panelX, y);

  // XP gain footnote
  ctx.font='18px Sans'; ctx.fillStyle='#9ca3af';
  ctx.fillText(`+${xpGain} XP`, panelX, height-40);

  return canvas.toBuffer('image/png');
}

module.exports = { generateLevelUpCard };
