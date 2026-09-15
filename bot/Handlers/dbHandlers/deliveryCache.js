const { conn } = require('./dbConnection');

async function getDeliveryHash(guildId, sectionKey){
  const [rows] = await conn.promise().query(
    'SELECT lastHash FROM deliveryCache WHERE guildId=? AND sectionKey=? LIMIT 1',
    [guildId, sectionKey]
  );
  return rows.length ? rows[0].lastHash : null;
}

async function setDeliveryHash(guildId, sectionKey, hash){
  await conn.promise().query(
    'INSERT INTO deliveryCache (guildId, sectionKey, lastHash) VALUES (?,?,?) ON DUPLICATE KEY UPDATE lastHash=VALUES(lastHash), updatedAt=CURRENT_TIMESTAMP',
    [guildId, sectionKey, hash]
  );
}

module.exports = { getDeliveryHash, setDeliveryHash };
