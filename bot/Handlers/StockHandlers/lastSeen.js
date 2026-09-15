const { state } = require("./state.js");
const { conn } = require("../dbHandlers/dbConnection.js");

async function fetchLastSeen(bot, stockType, start_unix) {
    return new Promise((resolve, reject) => {
        conn.query(`SELECT * FROM last_seen_stock WHERE stock_name="${stockType}" LIMIT 1`, async (err, stockRow) => {
            if (err) {
                console.log(err);
                return reject(err);
            }

            if (!stockRow || stockRow.length === 0) {
                conn.query(`INSERT INTO last_seen_stock (stock_name, last_seen) VALUES ("${stockType}", ${start_unix})`);
                console.log(`Inserted new stock: ${stockType} into database`);
                return resolve();
            } else {
                const stock_Name = stockRow[0].stock_name;
                const stock_Time = stockRow[0].last_seen + 300;
                const date_now_modified = (Date.now() / 1000) - 1200;

                if (stock_Name === stockType) {
                    if (start_unix > stock_Time && date_now_modified > stock_Time) {
                        conn.promise().query(`UPDATE last_seen_stock SET last_seen = ${start_unix} WHERE stock_name="${stockType}"`);
                        Object.assign(state.lastSeenTime, { [stock_Name]: stock_Time });
                        resolve();
                    } else {
                        conn.promise().query(`UPDATE last_seen_stock SET last_seen = ${start_unix} WHERE stock_name="${stockType}"`);
                        Object.assign(state.lastSeenTime, { [stock_Name]: "Now" });
                        resolve();
                    }
                } else {
                    resolve();
                }
            }
        });
    });
}

module.exports = { fetchLastSeen };