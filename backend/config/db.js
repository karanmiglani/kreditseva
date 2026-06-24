const db = require('mysql2');

const poolConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,
    connectionLimit: 10,
    waitForConnections: true
};

if (process.env.DB_SSL === 'true') {
    poolConfig.ssl = { rejectUnauthorized: true };
}

module.exports = db.createPool(poolConfig).promise();
