const { conn } = require('../dbHandlers/dbConnection.js');

function q(sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });
}

async function removeEntry(giveawayId, userId) {
    await q(`DELETE FROM giveaway_entries WHERE giveawayId = ? AND userId = ?`, [giveawayId, userId]);
}

async function ensureGiveawayTables() {
    await q(`
        CREATE TABLE IF NOT EXISTS giveaways (
            id BIGINT NOT NULL AUTO_INCREMENT,
            guildId VARCHAR(50) NOT NULL,
            channelId VARCHAR(50) NOT NULL,
            messageId VARCHAR(50) NOT NULL,
            hostId VARCHAR(50) NOT NULL,
            prize VARCHAR(200) NOT NULL,
            winnersCount INT NOT NULL DEFAULT 1,
            startedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            endsAt DATETIME NOT NULL,
            ended TINYINT(1) NOT NULL DEFAULT 0,
            endedAt DATETIME NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_message (messageId),
            KEY idx_guild_ended (guildId, ended),
            KEY idx_endsAt (ended, endsAt)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await q(`
        CREATE TABLE IF NOT EXISTS giveaway_entries (
            giveawayId BIGINT NOT NULL,
            userId VARCHAR(50) NOT NULL,
            enteredAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (giveawayId, userId),
            KEY idx_user (userId),
            CONSTRAINT fk_entries_giveaway FOREIGN KEY (giveawayId) REFERENCES giveaways(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await q(`
        CREATE TABLE IF NOT EXISTS giveaway_winners (
            id BIGINT NOT NULL AUTO_INCREMENT,
            giveawayId BIGINT NOT NULL,
            userId VARCHAR(50) NOT NULL,
            roll INT NOT NULL DEFAULT 1,
            createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_gw_giveaway (giveawayId),
            CONSTRAINT fk_winners_giveaway FOREIGN KEY (giveawayId) REFERENCES giveaways(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
}

async function createGiveaway({ guildId, channelId, messageId, hostId, prize, winnersCount, endsAt }) {
    const res = await q(
        `INSERT INTO giveaways (guildId, channelId, messageId, hostId, prize, winnersCount, endsAt)
         VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))`,
        [guildId, channelId, messageId, hostId, prize, winnersCount, Math.floor(endsAt / 1000)]
    );
    return res.insertId;
}

async function getGiveawayByMessageId(messageId) {
    const rows = await q(`SELECT * FROM giveaways WHERE messageId = ?`, [messageId]);
    return rows[0] || null;
}

async function getGiveawayById(id) {
    const rows = await q(`SELECT * FROM giveaways WHERE id = ?`, [id]);
    return rows[0] || null;
}

async function addEntry(giveawayId, userId) {
    try {
        await q(`INSERT INTO giveaway_entries (giveawayId, userId) VALUES (?, ?)`, [giveawayId, userId]);
        return true;
    } catch {
        return false; // duplicate or FK fail
    }
}

async function hasEntered(giveawayId, userId) {
    const rows = await q(`SELECT 1 FROM giveaway_entries WHERE giveawayId = ? AND userId = ? LIMIT 1`, [giveawayId, userId]);
    return !!rows.length;
}

async function getEntries(giveawayId) {
    return q(`SELECT userId FROM giveaway_entries WHERE giveawayId = ?`, [giveawayId]);
}

async function getActiveToEnd(limit = 10) {
    return q(
        `SELECT * FROM giveaways
         WHERE ended = 0 AND endsAt <= NOW()
         ORDER BY endsAt ASC
         LIMIT ?`,
        [Number(limit)]
    );
}

async function markEnded(giveawayId) {
    await q(`UPDATE giveaways SET ended = 1, endedAt = NOW() WHERE id = ?`, [giveawayId]);
}

async function currentRoll(giveawayId) {
    const rows = await q(`SELECT MAX(roll) AS r FROM giveaway_winners WHERE giveawayId = ?`, [giveawayId]);
    return Number(rows[0]?.r || 0);
}

async function pickWinners(giveawayId, winnersCount, excludeWinners = true, roll = 1) {
    // Exclude previous winners if rerolling
    const exclusion = excludeWinners ? `AND e.userId NOT IN (SELECT userId FROM giveaway_winners WHERE giveawayId = ?)` : '';
    const params = excludeWinners ? [giveawayId, giveawayId, winnersCount] : [giveawayId, winnersCount];

    const rows = await q(
        `
        SELECT e.userId
        FROM giveaway_entries e
        WHERE e.giveawayId = ?
        ${exclusion}
        ORDER BY RAND()
        LIMIT ?
        `,
        params
    );

    if (!rows.length) return [];

    // Record winners for this roll
    const values = rows.map(r => [giveawayId, r.userId, roll]);
    await q(
        `INSERT INTO giveaway_winners (giveawayId, userId, roll) VALUES ${values.map(() => '(?, ?, ?)').join(',')}`,
        values.flat()
    );

    return rows.map(r => r.userId);
}

async function finishGiveaway(giveawayId) {
    const g = await getGiveawayById(giveawayId);
    if (!g) throw new Error('Giveaway not found');
    if (g.ended) return { giveaway: g, winners: [] };

    const roll = (await currentRoll(giveawayId)) + 1;
    const winners = await pickWinners(giveawayId, g.winnersCount, true, roll);
    await markEnded(giveawayId);

    return { giveaway: await getGiveawayById(giveawayId), winners, roll };
}

async function rerollGiveaway(giveawayId) {
    const g = await getGiveawayById(giveawayId);
    if (!g) throw new Error('Giveaway not found');
    const roll = (await currentRoll(giveawayId)) + 1;
    const winners = await pickWinners(giveawayId, g.winnersCount, true, roll);
    return { giveaway: g, winners, roll };
}

async function listActive(guildId, limit = 10) {
    return q(
        `SELECT id, prize, channelId, messageId, winnersCount, UNIX_TIMESTAMP(endsAt) AS endsUnix
         FROM giveaways
         WHERE guildId = ? AND ended = 0
         ORDER BY endsAt ASC
         LIMIT ?`,
        [guildId, Number(limit)]
    );
}

module.exports = {
    ensureGiveawayTables,
    createGiveaway,
    getGiveawayByMessageId,
    getGiveawayById,
    addEntry,
    removeEntry,
    hasEntered,
    getEntries,
    getActiveToEnd,
    finishGiveaway,
    rerollGiveaway,
    listActive,
};