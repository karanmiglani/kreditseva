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

const pool = db.createPool(poolConfig);
const poolPromise = pool.promise();

async function testConnection() {
    try {
        const conn = await poolPromise.getConnection();
        conn.release();
        return true;
    } catch (err) {
        console.error('Database connection failed:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error(
                'Access denied — Hostinger checklist:\n' +
                '  1. hPanel → Databases → use MySQL username (e.g. u123456789_user), NOT root\n' +
                '  2. DB_PASSWORD = exact password from hPanel (no quotes in env)\n' +
                '  3. DB_NAME = full database name from hPanel (e.g. u123456789_kredit_seva)\n' +
                '  4. DB_HOST = localhost (same Hostinger account) or hostname from hPanel\n' +
                '  5. Set DEBUG_DB=true in Hostinger env to log masked password in app logs'
            );
            if (process.env.DEBUG_DB === 'true') {
                const { logDbEnv } = require('../utils/dbDebug');
                logDbEnv({});
            }
        }
        return false;
    }
}

poolPromise.testConnection = testConnection;

module.exports = poolPromise;
