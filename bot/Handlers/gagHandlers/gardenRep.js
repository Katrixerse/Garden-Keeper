const { conn } = require('../dbHandlers/dbConnection.js');

const COOLDOWN_MS = 12 * 60 * 60 * 1000; // 12h

function q(sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}

async function getRep(guildId, userId) {
    const rows = await q(
        'SELECT reputation FROM gardenReputation WHERE guildId = ? AND userId = ?',
        [guildId, userId]
    );
    return rows?.[0]?.reputation ?? 0;
}

async function canGiveRep(guildId, giverId) {
    const rows = await q(
        'SELECT lastGiven FROM gardenRepGives WHERE guildId = ? AND giverId = ?',
        [guildId, giverId]
    );
    if (!rows.length) return { ok: true, remainingMs: 0 };

    const last = new Date(rows[0].lastGiven).getTime();
    const now = Date.now();
    const elapsed = now - last;
    if (elapsed >= COOLDOWN_MS) return { ok: true, remainingMs: 0 };
    return { ok: false, remainingMs: COOLDOWN_MS - elapsed };
}

async function markGiven(guildId, giverId) {
    await q(
        'INSERT INTO gardenRepGives (giverId, guildId, lastGiven) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastGiven = VALUES(lastGiven)',
        [giverId, guildId]
    );
}

async function giveRep(guildId, targetId, giverId, reason = null) {
    await q(
        'INSERT INTO gardenReputation (userId, guildId, reputation) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE reputation = reputation + 1',
        [targetId, guildId]
    );
    await markGiven(guildId, giverId);
    await q(
        'INSERT INTO gardenRepHistory (guildId, targetId, giverId, reason) VALUES (?, ?, ?, ?)',
        [guildId, targetId, giverId, reason]
    );
    return getRep(guildId, targetId);
}

async function getLeaderboard(guildId, limit = 10) {
    const rows = await q(
        'SELECT userId, reputation FROM gardenReputation WHERE guildId = ? ORDER BY reputation DESC, userId ASC LIMIT ?',
        [guildId, Number(limit)]
    );
    return rows;
}

module.exports = {
    COOLDOWN_MS,
    getRep,
    canGiveRep,
    giveRep,
    getLeaderboard,
};