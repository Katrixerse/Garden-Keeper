const Canvas = require('canvas');
let gifFrames; try { gifFrames = require('gif-frames'); } catch { gifFrames = null; }
const { getLevel, calcNeededXP, getBadges, getTitleForLevel, getRankCardBackground, calcCumulativeXP, getUserRankPosition } = require('../../Handlers/leveling/levels');
const { BADGE_IMAGES } = require('../../Handlers/leveling/badgeImages');
module.exports = {
  name: 'rank',
  description: 'Rank card',
  botPermissions: 'AttachFiles',
  userPermissions: 'none',
  async run(bot, prefix, message) {
    const user = message.mentions.users.first() || message.author;
    const { xp, level } = await getLevel(message.guild.id, user.id);
    const position = await getUserRankPosition(message.guild.id, user.id);
    const rawBadges = await getBadges(message.guild.id, user.id);
    const MAX_BADGES = 30; // hard cap on number of badges rendered
    const badges = rawBadges.slice(0, MAX_BADGES);
    const title = getTitleForLevel(level);
    const next = calcNeededXP(level + 1);
    const percent = Math.min(1, xp / next);
    const width = 900;
    const hasBadges = badges.length > 0;
    // Pre-calc rows needed for badges so we can size canvas BEFORE creating it
    const badgeSize = 64, badgeMinGap = 12;
    let badgeRows = 0;
    if (hasBadges) {
      // Mirror layout math (panel values reused later)
      const panelMarginRight = 40;
      const panelXTmp = 170; // same as panelX later
      const panelWTmp = width - panelXTmp - panelMarginRight;
      const contentLeftTmp = panelXTmp + 40;
      const areaWTmp = panelXTmp + panelWTmp - contentLeftTmp - 40;
      const maxPerRowTmp = Math.max(1, Math.floor((areaWTmp + badgeMinGap) / (badgeSize + badgeMinGap)));
      badgeRows = Math.ceil(badges.length / maxPerRowTmp);
    }
    // Base height (no badges): 280. Original single-row height: 360 (+80).
    // For each additional row beyond first, add badgeSize + 20 vertical space.
    const height = hasBadges ? 420 + (Math.max(0, badgeRows - 1)) * (badgeSize + 20) : 400;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const isAnimatedAvatar = user.avatar && user.avatar.startsWith('a_');
    // We'll render static by default; if animated and libs available we'll build GIF frames.
    const maxAvatarFrames = 20; // cap frames for performance
    let avatarFrameImages = [];
    if (isAnimatedAvatar && gifFrames) {
      try {
        const avatarGIF = user.displayAvatarURL({ extension: 'gif', size: 128 });
        const extracted = await gifFrames({ url: avatarGIF, frames: 'all', outputType: 'png', cumulative: true });
        // Down-sample if too many frames
        const step = Math.ceil(extracted.length / maxAvatarFrames);
        for (let i = 0; i < extracted.length && avatarFrameImages.length < maxAvatarFrames; i += step) {
          const frame = extracted[i];
          const stream = frame.getImage();
          const buf = await new Promise((res, rej) => { const chunks = []; stream.on('data', c => chunks.push(c)); stream.on('end', () => res(Buffer.concat(chunks))); stream.on('error', rej); });
          try { const img = await Canvas.loadImage(buf); avatarFrameImages.push(img); } catch { }
        }
      } catch { avatarFrameImages = []; }
    }

    // Helper: rounded rect
    function rrect(x, y, w, h, r) {
      r = Math.min(r, h / 2, w / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    // Background selection
    const bg = await getRankCardBackground(message.guild.id, user.id);
    async function paintPreset(name) {
      switch (name) {
        case 'forest': {
          const g = ctx.createLinearGradient(0, 0, width, height);
          g.addColorStop(0, '#0f2027'); g.addColorStop(0.5, '#2c7744'); g.addColorStop(1, '#004e1f'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); break;
        }
        case 'dusk': {
          const g = ctx.createLinearGradient(0, 0, width, height);
          g.addColorStop(0, '#355C7D'); g.addColorStop(0.5, '#6C5B7B'); g.addColorStop(1, '#C06C84'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); break;
        }
        case 'sunset': {
          const g = ctx.createLinearGradient(0, 0, width, height);
          g.addColorStop(0, '#0B486B'); g.addColorStop(1, '#F56217'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); break;
        }
        case 'ocean': {
          const g = ctx.createLinearGradient(0, 0, width, height);
          g.addColorStop(0, '#141E30'); g.addColorStop(1, '#243B55'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); break;
        }
        case 'midnight': default: {
          const g = ctx.createLinearGradient(0, 0, width, height);
          g.addColorStop(0, '#0f2027'); g.addColorStop(0.5, '#203a43'); g.addColorStop(1, '#2c5364'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); break;
        }
      }
    }
    if (!bg) {
      await paintPreset('midnight');
    } else if (bg.bg_type === 'preset') {
      await paintPreset(bg.bg_value || 'midnight');
    } else if (bg.bg_type === 'color') {
      ctx.fillStyle = bg.bg_value; ctx.fillRect(0, 0, width, height);
    } else if (bg.bg_type === 'image') {
      try { const img = await Canvas.loadImage(bg.bg_value); ctx.drawImage(img, 0, 0, width, height); } catch { await paintPreset('midnight'); }
    }

    // Glass panel
    // Adjusted spacing: shift panel slightly right for clearer separation from avatar
    // Increased left offset for panel to give avatar more breathing room
    const panelMarginRight = 40;
    const panelX = 190, panelY = 35, panelW = width - panelX - panelMarginRight, panelH = height - 50; // panel grows with new height
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#ffffff';
    rrect(panelX, panelY, panelW, panelH, 28); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    rrect(panelX, panelY, panelW, panelH, 28); ctx.stroke();

    // Avatar with ring
    // Avatar centered a bit more left after panel shift
    const centerA = 95, centerY = height / 2; // avatar stays; panel moved right creating extra gap
    async function drawAvatar(frameImg) {
      // Outer ring
      ctx.beginPath(); ctx.arc(centerA, centerY, 82, 0, Math.PI * 2); ctx.strokeStyle = '#4caf50'; ctx.lineWidth = 6; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.arc(centerA, centerY, 76, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
      ctx.drawImage(frameImg, centerA - 76, centerY - 76, 152, 152);
      ctx.restore();
    }
    let staticAvatarImg = null;
    if (!avatarFrameImages.length) {
      try { staticAvatarImg = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 256 })); } catch { }
    }

    // Text metrics / layout
    const contentLeft = panelX + 40;
    // Initial text Y position a bit lower for better vertical balance
    let y = panelY + 68;
    // Username (truncate if long)
    ctx.font = '700 42px Sans';
    ctx.fillStyle = '#ffffff';
    let uname = user.username;
    const maxNameWidth = panelX + panelW - contentLeft - 40;
    while (ctx.measureText(uname).width > maxNameWidth) {
      if (uname.length <= 3) break; uname = uname.slice(0, -4) + '…';
    }
    ctx.fillText(uname, contentLeft, y);
    // Title under username
    ctx.font = 'italic 26px Sans';
    ctx.fillStyle = '#e5f8d5';
    ctx.fillText(title, contentLeft, y + 34);

    // Level & XP line
    y += 88; // slightly more space after title before stats line
    ctx.font = '24px Sans';
    ctx.fillStyle = '#ffffffff';
    const needed = next - xp;
    let rankLine = `Level ${level} • ${xp.toLocaleString()} / ${next.toLocaleString()} XP ( ${needed.toLocaleString()} to next )`;
    if (position) rankLine = `#${position} • ` + rankLine;
    ctx.fillText(rankLine, contentLeft, y);

    // Total XP (cumulative) line
    const totalXP = calcCumulativeXP(level, xp);
    y += 38;
    ctx.font = '22px Sans';
    ctx.fillStyle = '#ffffffff';
    ctx.fillText(`Total XP: ${totalXP.toLocaleString()}`, contentLeft, y);

    // Progress bar (clipped to prevent overflow)
    y += 25; // adjust for added total xp line
    const barX = contentLeft, barY = y, barW = panelX + panelW - contentLeft - 40, barH = 38;
    // Background pill
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff'; rrect(barX, barY, barW, barH, barH / 2); ctx.fill(); ctx.globalAlpha = 1;
    // Clip to container then draw fill
    ctx.save();
    rrect(barX, barY, barW, barH, barH / 2); ctx.clip();
    const fillWidth = Math.floor(barW * percent);
    if (fillWidth > 0) {
      const fillGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      fillGrad.addColorStop(0, '#56ab2f'); fillGrad.addColorStop(1, '#a8e063');
      ctx.fillStyle = fillGrad;
      // Adaptive radius so very small widths don't create artifacts
      const dynRadius = Math.min(barH / 2, fillWidth / 2);
      rrect(barX, barY, fillWidth, barH, dynRadius); ctx.fill();
    }
    ctx.restore();
    // Border
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; rrect(barX, barY, barW, barH, barH / 2); ctx.stroke();

    // Percentage text centered
    ctx.font = '700 20px Sans';
    ctx.fillStyle = '#ffffff';
    const pctTxt = (percent * 100).toFixed(1) + '%';
    const txtW = ctx.measureText(pctTxt).width;
    ctx.fillText(pctTxt, barX + (barW - txtW) / 2, barY + barH / 2 + 7);

    // Badges row (simple squares with label) placed directly below bar inside extended panel
    let footerY;
    if (badges.length) {
      // Separator line between progress bar and badge section
      const lineY = barY + barH + 18;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(contentLeft, lineY);
      ctx.lineTo(contentLeft + barW, lineY);
      ctx.stroke();
      const firstRowY = barY + barH + 32; // badges start below separator
      const size = badgeSize; // keep consistent
      const minGap = badgeMinGap;
      const areaW = panelX + panelW - contentLeft - 40; // drawable width for badges row
      const maxPerRow = Math.max(1, Math.floor((areaW + minGap) / (size + minGap)));
      let row = 0; let index = 0;
      while (index < badges.length) {
        const remaining = badges.length - index;
        const count = Math.min(maxPerRow, remaining);
        const rowBadges = badges.slice(index, index + count);
        // dynamic gap for this row
        let gap = minGap;
        if (count > 1) {
          const totalBadgesWidth = count * size;
          const leftover = areaW - totalBadgesWidth;
          gap = Math.min(48, Math.max(minGap, leftover / (count - 1)));
        }
        const rowWidth = count * size + (count - 1) * (count === 1 ? 0 : gap);
        let startX = contentLeft + (areaW - rowWidth) / 2; startX = Math.round(startX) + 0.5;
        const badgeY = firstRowY + row * (size + 20);
        for (let i = 0; i < rowBadges.length; i++) {
          const key = rowBadges[i];
          const bx = startX + i * (size + (count === 1 ? 0 : gap));
          const src = BADGE_IMAGES[key];
          if (src) {
            try { const img = await Canvas.loadImage(src); ctx.drawImage(img, bx, badgeY, size, size); } catch { }
          } else {
            ctx.fillStyle = 'rgba(255,255,255,0.15)'; rrect(bx, badgeY, size, size, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; rrect(bx, badgeY, size, size, 12); ctx.stroke();
            ctx.font = '600 14px Sans'; ctx.fillStyle = '#ffffff'; const label = key.slice(0, 6); const tw = ctx.measureText(label).width; ctx.fillText(label, bx + (size - tw) / 2, badgeY + size / 2 + 5);
          }
        }
        index += count; row++;
      }
      footerY = firstRowY + row * (size + 20) - 20 + size + 24; // position after last row
      // Overflow indicator if we truncated badges
      if (rawBadges.length > badges.length) {
        ctx.font = '14px Sans';
        ctx.fillStyle = '#a3e3b2';
        ctx.fillText(`(+${rawBadges.length - badges.length} more)`, contentLeft, footerY - 6);
      }
    } else {
      footerY = barY + 10 + barH + 15;
    }

    // Small footer moved below badges if present
    ctx.font = '16px Sans';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(`ID: ${user.id}`, contentLeft, footerY);

    // Draw static avatar now and export PNG
    if (staticAvatarImg) { await drawAvatar(staticAvatarImg); }
    const attachment = { files: [{ attachment: canvas.toBuffer('image/png'), name: 'rank.png' }] };
    message.channel.send(attachment).catch(() => { });
  }
};
