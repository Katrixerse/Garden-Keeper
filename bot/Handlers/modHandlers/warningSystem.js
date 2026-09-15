const { conn } = require("../dbHandlers/dbConnection.js");

// Ensure table exists (idempotent)
async function ensureTable() {
    await conn.promise().query(`
        CREATE TABLE IF NOT EXISTS mod_warns (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            guild_id VARCHAR(20) NOT NULL,
            user_id VARCHAR(20) NOT NULL,
            moderator_id VARCHAR(20) NOT NULL,
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_guild_user (guild_id, user_id),
            INDEX idx_guild (guild_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
}

async function addWarn(guildId, userId, moderatorId, reason) {
    await ensureTable();
    await conn.promise().query(
        "INSERT INTO mod_warns (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)",
        [String(guildId), String(userId), String(moderatorId), String(reason || "No reason provided")]
    );
    const [[{ c }]] = await conn.promise().query(
        "SELECT COUNT(*) AS c FROM mod_warns WHERE guild_id = ? AND user_id = ?",
        [String(guildId), String(userId)]
    );
    return {
        index: Number(c),
        entry: { moderatorId, reason: reason || "No reason provided", at: Date.now() }
    };
}

async function listWarns(guildId, userId) {
    await ensureTable();
    const [rows] = await conn.promise().query(
        "SELECT moderator_id, reason, created_at FROM mod_warns WHERE guild_id = ? AND user_id = ? ORDER BY created_at ASC, id ASC",
        [String(guildId), String(userId)]
    );
    return rows.map(r => ({
        moderatorId: r.moderator_id,
        reason: r.reason || "No reason provided",
        at: new Date(r.created_at).getTime()
    }));
}

async function removeWarn(guildId, userId, index1Based) {
    await ensureTable();
    const [rows] = await conn.promise().query(
        "SELECT id, moderator_id, reason, created_at FROM mod_warns WHERE guild_id = ? AND user_id = ? ORDER BY created_at ASC, id ASC",
        [String(guildId), String(userId)]
    );
    if (!rows.length) return null;

    const idx = Math.min(Math.max(1, Number(index1Based || rows.length)), rows.length) - 1;
    const target = rows[idx];
    if (!target) return null;

    await conn.promise().query("DELETE FROM mod_warns WHERE id = ?", [target.id]);

    return {
        index: idx + 1,
        entry: {
            moderatorId: target.moderator_id,
            reason: target.reason || "No reason provided",
            at: new Date(target.created_at).getTime()
        }
    };
}

module.exports = { addWarn, listWarns, removeWarn };