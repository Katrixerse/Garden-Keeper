const { conn } = require("../dbHandlers/dbConnection.js");

async function createTables() {
    const exec = (sql) =>
        new Promise((resolve, reject) => {
            conn.query(sql, (err) => (err ? reject(err) : resolve()));
        });

    // Helper: add column if missing (works on older MySQL versions lacking IF NOT EXISTS on ADD COLUMN)
    async function ensureColumn(table, column, definition){
        try {
            const [rows] = await conn.promise().query(
                `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
                [table, column]
            );
            if(rows.length) return; // already exists
            await conn.promise().query(`ALTER TABLE \`${table}\` ADD COLUMN ${definition}`);
            console.log(`[DB] Added missing column ${column} to ${table}`);
        } catch(e){
            console.warn(`[DB] ensureColumn ${table}.${column} failed:`, e.message);
        }
    }

    try {
        // Bot Settings (single-row pattern)
        await exec(`
            CREATE TABLE IF NOT EXISTS botSettings (
                id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
                maintenanceMode TINYINT(1) NOT NULL DEFAULT 0,
                maintenanceETA VARCHAR(30) NULL,
                maintenanceReason VARCHAR(255) NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Bot Settings End

        // Guild Settings
        await exec(`
            CREATE TABLE IF NOT EXISTS guildPrefix (
                guildId VARCHAR(50) PRIMARY KEY,
                prefix VARCHAR(10) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS guildSettings (
                guildId VARCHAR(50) PRIMARY KEY,
                modLogsEnabled TINYINT(1) NOT NULL DEFAULT 0,
                chatLogsEnabled TINYINT(1) NOT NULL DEFAULT 0,
                modLogsChannel VARCHAR(50) NULL,
                chatLogsChannel VARCHAR(50) NULL,
                rolePersist TINYINT(1) NOT NULL DEFAULT 0,
                serverLevels TINYINT(1) NOT NULL DEFAULT 0,
                ServerCash TINYINT(1) NOT NULL DEFAULT 0,
                modOnlyCommands TINYINT(1) NOT NULL DEFAULT 0,
                disabledEvents TEXT NULL,
                serverStats TINYINT(1) NOT NULL DEFAULT 0,
                serverCaptcha TINYINT(1) NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Guild Settings End

        // Guild Tickets
        await exec(`
            CREATE TABLE IF NOT EXISTS guildTickets (
                guildId VARCHAR(50) NOT NULL,
                roles TEXT NULL,
                ticketNumber INT NOT NULL DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS guildTicketOptions (
                guildId VARCHAR(50) NOT NULL,
                content TEXT NULL,
                field_name VARCHAR(80) NOT NULL,
                field_value VARCHAR(80) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Guild Ticket Ends

        // Grow a Garden Reputation
        await exec(`
            CREATE TABLE IF NOT EXISTS gardenReputation (
                guildId VARCHAR(50) NOT NULL,
                userId VARCHAR(50) NOT NULL,
                reputation INT NOT NULL DEFAULT 0,
                PRIMARY KEY (guildId, userId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS gardenRepGives (
                guildId VARCHAR(50) NOT NULL,
                giverId VARCHAR(50) NOT NULL,
                lastGiven DATETIME NOT NULL,
                PRIMARY KEY (guildId, giverId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS gardenRepHistory (
                guildId VARCHAR(50) NOT NULL,
                id BIGINT NOT NULL AUTO_INCREMENT,
                targetId VARCHAR(50) NOT NULL,
                giverId VARCHAR(50) NOT NULL,
                reason VARCHAR(255) NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY idx_guild_createdAt (guildId, createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Garden Reputation End

        // Grow A Garden Stocks
        await exec(`
            CREATE TABLE IF NOT EXISTS last_seen_stock (stock_name TEXT(50), last_seen INTEGER(15))
        `);
        // Grow A Garden Stocks End

        // Guild specific stock channel configuration
        await exec(`
            CREATE TABLE IF NOT EXISTS guildStockChannels (
                guildId VARCHAR(50) PRIMARY KEY,
                stockChannelId VARCHAR(50) NULL,
                eggChannelId VARCHAR(50) NULL,
                eventChannelId VARCHAR(50) NULL,
                merchantChannelId VARCHAR(50) NULL,
                cosmeticsChannelId VARCHAR(50) NULL,
                weatherChannelId VARCHAR(50) NULL,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Guild specific stock channel configuration End

        // Roblox Verify Tables
        await exec(`
            CREATE TABLE IF NOT EXISTS robloxLinks (
                discordId VARCHAR(50) PRIMARY KEY,
                robloxUserId BIGINT NOT NULL,
                robloxUsername VARCHAR(100) NOT NULL,
                verifiedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS robloxVerifyCodes (
                discordId VARCHAR(50) PRIMARY KEY,
                robloxUserId BIGINT NOT NULL,
                robloxUsername VARCHAR(100) NOT NULL,
                code VARCHAR(16) NOT NULL,
                expiresAt DATETIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Roblox Verify Codes End

        // Reaction Roles
        await exec(`
            CREATE TABLE IF NOT EXISTS reactionRoles (
                guildId VARCHAR(50) NOT NULL,
                messageId VARCHAR(50) NOT NULL,
                channelId VARCHAR(50) NOT NULL,
                emoji VARCHAR(200) NOT NULL,
                roleId VARCHAR(50) NOT NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (guildId, messageId, emoji),
                KEY idx_guild (guildId),
                KEY idx_message (messageId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Reaction Roles End

        // Economy (Grow a Garden inspired)
        await exec(`
            CREATE TABLE IF NOT EXISTS gardenProfiles (
                guildId VARCHAR(50) NOT NULL,
                userId VARCHAR(50) NOT NULL,
                cash BIGINT NOT NULL DEFAULT 0,
                seeds INT NOT NULL DEFAULT 5,
                fertilizer INT NOT NULL DEFAULT 0,
                plotSlots INT NOT NULL DEFAULT 5,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (guildId, userId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await exec(`
            CREATE TABLE IF NOT EXISTS gardenPlots (
                guildId VARCHAR(50) NOT NULL,
                userId VARCHAR(50) NOT NULL,
                slot INT NOT NULL,
                stage TINYINT NOT NULL DEFAULT 0, -- 0 empty,1 seed,2 sprout,3 mature,4 ready
                plantedAt BIGINT NOT NULL DEFAULT 0,
                PRIMARY KEY (guildId, userId, slot)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        // Economy End
        // Expanded seed economy
        await exec(`
            CREATE TABLE IF NOT EXISTS gardenSeedInventory (
                guildId VARCHAR(50) NOT NULL,
                userId VARCHAR(50) NOT NULL,
                seedType VARCHAR(32) NOT NULL,
                amount INT NOT NULL DEFAULT 0,
                PRIMARY KEY (guildId,userId,seedType)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    // Add seedType column to plots if missing (older servers may not have it)
    await ensureColumn('gardenPlots','seedType',"seedType VARCHAR(32) NOT NULL DEFAULT 'basic'");

        // Hourly seed rotation (dynamic shop)
        await exec(`
            CREATE TABLE IF NOT EXISTS gardenSeedRotation (
                guildId VARCHAR(50) NOT NULL,
                periodStart BIGINT NOT NULL,
                seedType VARCHAR(40) NOT NULL,
                stock INT NOT NULL,
                PRIMARY KEY (guildId, periodStart, seedType)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    // Ensure columns (in case early prototype table existed without seedType)
    await ensureColumn('gardenSeedRotation','seedType',"seedType VARCHAR(40) NOT NULL AFTER periodStart");
    await ensureColumn('gardenSeedRotation','stock',"stock INT NOT NULL DEFAULT 0");
        await exec(`
            CREATE TABLE IF NOT EXISTS gardenSeedPurchases (
                guildId VARCHAR(50) NOT NULL,
                periodStart BIGINT NOT NULL,
                userId VARCHAR(50) NOT NULL,
                seedType VARCHAR(40) NOT NULL,
                amount INT NOT NULL DEFAULT 0,
                PRIMARY KEY (guildId, periodStart, userId, seedType)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    await ensureColumn('gardenSeedPurchases','seedType',"seedType VARCHAR(40) NOT NULL AFTER userId");
    await ensureColumn('gardenSeedPurchases','amount',"amount INT NOT NULL DEFAULT 0");

        // Welcome settings (per guild)
        await exec(`
            CREATE TABLE IF NOT EXISTS guildWelcomeSettings (
                guildId VARCHAR(50) PRIMARY KEY,
                enabled TINYINT(1) NOT NULL DEFAULT 0,
                channelId VARCHAR(50) NULL,
                messageTemplate TEXT NULL,
                backgroundUrl TEXT NULL,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await ensureColumn('guildWelcomeSettings','backgroundUrl',"backgroundUrl TEXT NULL AFTER messageTemplate");

        // Moderation audit logging
        await exec(`
            CREATE TABLE IF NOT EXISTS guildModAuditSettings (
                guildId VARCHAR(50) PRIMARY KEY,
                channelId VARCHAR(50) NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 0,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        await exec(`
            CREATE TABLE IF NOT EXISTS guildModAuditLog (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                guildId VARCHAR(50) NOT NULL,
                action VARCHAR(32) NOT NULL,
                targetId VARCHAR(50) NULL,
                moderatorId VARCHAR(50) NULL,
                reason TEXT NULL,
                extra JSON NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_guild_created (guildId, createdAt),
                KEY idx_guild_action (guildId, action)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Level role rewards
        await exec(`
            CREATE TABLE IF NOT EXISTS guildLevelRoles (
                guildId VARCHAR(50) NOT NULL,
                level INT NOT NULL,
                roleId VARCHAR(50) NOT NULL,
                grantMode ENUM('stack','replace') NOT NULL DEFAULT 'stack',
                PRIMARY KEY (guildId, level, roleId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Captcha verification settings
        await exec(`
            CREATE TABLE IF NOT EXISTS guildCaptchaSettings (
                guildId VARCHAR(50) PRIMARY KEY,
                enabled TINYINT(1) NOT NULL DEFAULT 0,
                roleId VARCHAR(50) NULL,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Pending captcha challenges (token based)
        await exec(`
            CREATE TABLE IF NOT EXISTS guildCaptchaPending (
                token VARCHAR(64) PRIMARY KEY,
                guildId VARCHAR(50) NOT NULL,
                userId VARCHAR(50) NOT NULL,
                challenge VARCHAR(100) NOT NULL,
                answerHash CHAR(64) NOT NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_guild_user (guildId, userId),
                KEY idx_created (createdAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // YouTube upload alerts subscriptions
        await exec(`
            CREATE TABLE IF NOT EXISTS guildYouTubeAlerts (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                guildId VARCHAR(50) NOT NULL,
                ytChannelId VARCHAR(64) NOT NULL,
                discordChannelId VARCHAR(50) NOT NULL,
                mentionRoleId VARCHAR(50) NULL,
                lastVideoId VARCHAR(32) NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                template VARCHAR(200) NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_guild_yt (guildId, ytChannelId),
                KEY idx_guild (guildId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Twitch live alerts subscriptions
        await exec(`
            CREATE TABLE IF NOT EXISTS guildTwitchAlerts (
                id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                guildId VARCHAR(50) NOT NULL,
                twitchUserId VARCHAR(32) NOT NULL,
                login VARCHAR(50) NULL,
                discordChannelId VARCHAR(50) NOT NULL,
                mentionRoleId VARCHAR(50) NULL,
                lastStreamId VARCHAR(50) NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                template VARCHAR(240) NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_guild_user (guildId, twitchUserId),
                KEY idx_guild (guildId)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Persistent delivery cache (prevents duplicate announcements across restarts)
        await exec(`
            CREATE TABLE IF NOT EXISTS deliveryCache (
                guildId VARCHAR(50) NOT NULL,
                sectionKey VARCHAR(64) NOT NULL,
                lastHash VARCHAR(255) NOT NULL,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (guildId, sectionKey),
                KEY idx_updated (updatedAt)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    } catch (err) {
        console.error('Error creating tables:', err);
    }
}

module.exports = { createTables };