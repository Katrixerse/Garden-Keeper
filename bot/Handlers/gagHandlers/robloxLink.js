const { PermissionsBitField } = require('discord.js');
const { conn } = require('../dbHandlers/dbConnection.js');
const request = require('node-superfetch');

const VERIFIED_ROLE_NAMES = ['Verified', 'Roblox Verified', 'Roblox-Verified'];

function q(sql, params = []) {
    return new Promise((resolve, reject) => {
        conn.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });
}

async function resolveUsername(username) {
    const { body } = await request
        .post('https://users.roblox.com/v1/usernames/users')
        .set('Content-Type', 'application/json')
        .send({ usernames: [username], excludeBannedUsers: true });

    const user = body?.data?.[0];
    if (!user || !user.id) throw new Error('Roblox user not found');
    return { userId: Number(user.id), username: user.requestedUsername || user.name || username };
}

async function getUserDescription(userId) {
    const { body } = await request
        .get(`https://users.roblox.com/v1/users/${userId}`);
    return body?.description || '';
}

function genCode() {
    return (Math.floor(100000 + Math.random() * 900000)).toString();
}

async function startVerification(discordId, username) {
    const { userId, username: normalized } = await resolveUsername(username);
    const code = genCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await q(
        `INSERT INTO robloxVerifyCodes (discordId, robloxUserId, robloxUsername, code, expiresAt)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE robloxUserId=VALUES(robloxUserId), robloxUsername=VALUES(robloxUsername), code=VALUES(code), expiresAt=VALUES(expiresAt)`,
        [discordId, userId, normalized, code, expiresAt]
    );

    return { userId, username: normalized, code, expiresAt };
}

// Helper: find a suitable Verified role in a guild
function findVerifiedRole(guild) {
    return guild.roles.cache.find(r =>
        VERIFIED_ROLE_NAMES.some(n => r.name.toLowerCase() === n.toLowerCase())
    ) || null;
}

// Helper: grant the Verified role if possible
async function grantVerifiedRole(guild, userId) {
    try {
        const role = findVerifiedRole(guild);
        if (!role) return { ok: false, reason: 'no-role' };

        const me = guild.members.me || await guild.members.fetch(guild.client.user.id);
        if (!me.permissions.has(PermissionsBitField.Flags.ManageRoles)) return { ok: false, reason: 'no-manage-roles' };
        if (me.roles.highest.comparePositionTo(role) <= 0) return { ok: false, reason: 'role-too-high' };

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) return { ok: false, reason: 'no-member' };
        if (member.roles.cache.has(role.id)) return { ok: true, already: true, roleId: role.id };

        await member.roles.add(role, 'Roblox verification complete');
        return { ok: true, roleId: role.id };
    } catch (e) {
        return { ok: false, reason: 'error', error: e?.message };
    }
}

/**
 * Verify the user by checking their Roblox profile description for the code.
 * If a guild is provided, automatically grants a Verified role upon success.
 * @param {string} discordId
 * @param {import('discord.js').Guild} [guild] optional guild to grant role in
 */
async function checkVerification(discordId, guild) {
    const rows = await q(
        'SELECT robloxUserId, robloxUsername, code, expiresAt FROM robloxVerifyCodes WHERE discordId = ?',
        [discordId]
    );
    if (!rows.length) throw new Error('No active verification. Start with your Roblox username.');
    const rec = rows[0];

    if (new Date(rec.expiresAt).getTime() < Date.now()) {
        await q('DELETE FROM robloxVerifyCodes WHERE discordId = ?', [discordId]);
        throw new Error('Your verification code expired. Start again.');
    }

    const desc = await getUserDescription(rec.robloxUserId);
    if (!desc || !desc.includes(rec.code)) {
        throw new Error('Code not found in your Roblox profile description. Make sure it is saved and try again.');
    }

    await q(
        `INSERT INTO robloxLinks (discordId, robloxUserId, robloxUsername)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE robloxUserId=VALUES(robloxUserId), robloxUsername=VALUES(robloxUsername), verifiedAt=CURRENT_TIMESTAMP`,
        [discordId, rec.robloxUserId, rec.robloxUsername]
    );
    await q('DELETE FROM robloxVerifyCodes WHERE discordId = ?', [discordId]);

    // Attempt to grant Verified role if guild provided
    let roleGrant = null;
    if (guild) {
        roleGrant = await grantVerifiedRole(guild, discordId);
    }

    return {
        robloxUserId: rec.robloxUserId,
        robloxUsername: rec.robloxUsername,
        roleGrant // { ok, roleId?, already?, reason? }
    };
}

async function getLink(discordId) {
    const rows = await q('SELECT robloxUserId, robloxUsername, verifiedAt FROM robloxLinks WHERE discordId = ?', [discordId]);
    return rows[0] || null;
}

async function unlink(discordId) {
    await q('DELETE FROM robloxLinks WHERE discordId = ?', [discordId]);
}

module.exports = {
    VERIFIED_ROLE_NAMES,
    startVerification,
    checkVerification, // now supports optional guild param to auto-assign role
    getLink,
    unlink,
    // helper exported in case you want to grant roles elsewhere (optional)
    grantVerifiedRole,
};