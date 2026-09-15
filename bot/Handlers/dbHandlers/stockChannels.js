const { conn } = require('./dbConnection');

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

async function getGuildStockChannels(guildId) {
    const rows = await run('SELECT * FROM guildStockChannels WHERE guildId = ?', [guildId]);
    return rows[0] || null;
}

async function upsertGuildStockChannel(guildId, key, channelId) {
    const allowed = new Set(['stockChannelId','eggChannelId','eventChannelId','merchantChannelId','cosmeticsChannelId','weatherChannelId']);
    if(!allowed.has(key)) throw new Error('Invalid channel key');
    await run(`INSERT INTO guildStockChannels (guildId, ${key}) VALUES (?, ?) 
               ON DUPLICATE KEY UPDATE ${key}=VALUES(${key})`, [guildId, channelId]);
    return true;
}

module.exports = { getGuildStockChannels, upsertGuildStockChannel };
