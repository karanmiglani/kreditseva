const db = require('mysql2');
const { logDbEnv } = require('../utils/dbDebug');

console.log('DB_PASSWORD', process.env.DB_PASSWORD);

function buildPoolConfig(overrides = {}) {
    const host = overrides.host ?? process.env.DB_HOST;
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        dateStrings: true,
        connectionLimit: 10,
        waitForConnections: true,
        ...overrides
    };

    if (process.env.DB_SOCKET) {
        config.socketPath = process.env.DB_SOCKET;
        delete config.host;
        delete config.port;
    } else {
        config.host = host;
        config.port = Number(process.env.DB_PORT) || 3306;
    }

    if (process.env.DB_SSL === 'true') {
        config.ssl = { rejectUnauthorized: true };
    }

    return config;
}

let pool = db.createPool(buildPoolConfig());
let poolPromise = pool.promise();

function recreatePool(overrides = {}) {
    return new Promise((resolve) => {
        pool.end(() => {
            pool = db.createPool(buildPoolConfig(overrides));
            poolPromise = pool.promise();
            resolve(poolPromise);
        });
    });
}

async function tryGetConnection(configOverrides) {
    const testPool = db.createPool(buildPoolConfig(configOverrides));
    const testPromise = testPool.promise();
    try {
        const conn = await testPromise.getConnection();
        conn.release();
        await testPool.end();
        return true;
    } catch (err) {
        await testPool.end().catch(() => {});
        throw err;
    }
}

async function testConnection() {
    const attempts = [
        { label: 'configured host', overrides: {} }
    ];

    if (!process.env.DB_SOCKET && process.env.DB_HOST === 'localhost') {
        attempts.push({ label: '127.0.0.1 (TCP fallback)', overrides: { host: '127.0.0.1' } });
    }

    if (!process.env.DB_SOCKET && process.env.DB_HOST === '127.0.0.1') {
        attempts.push({ label: 'localhost (socket fallback)', overrides: { host: 'localhost' } });
    }

    let lastError = null;

    for (const attempt of attempts) {
        try {
            if (Object.keys(attempt.overrides).length > 0) {
                console.log(`[DB] Retrying with ${attempt.label}...`);
            }

            const ok = await tryGetConnection(attempt.overrides);
            if (ok && Object.keys(attempt.overrides).length > 0) {
                console.log(`[DB] Connected using ${attempt.label}. Update DB_HOST in Hostinger env.`);
                await recreatePool(attempt.overrides);
            }
            return true;
        } catch (err) {
            lastError = err;
            console.error(`[DB] ${attempt.label} failed:`, err.message);
        }
    }

    logDbEnv({});
    console.error('[DB] Active config:', {
        host: process.env.DB_SOCKET ? `(socket ${process.env.DB_SOCKET})` : process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        passwordLength: (process.env.DB_PASSWORD || '').length
    });

    if (lastError?.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error(
            'Access denied — fix in Hostinger hPanel → Databases:\n' +
            '  1. Copy MySQL username EXACTLY (e.g. u123456789_kredituser) → DB_USER\n' +
            '  2. Copy database name EXACTLY (e.g. u123456789_kredit_seva) → DB_NAME\n' +
            '  3. Reset DB user password in hPanel, paste fresh value → DB_PASSWORD (no quotes)\n' +
            '  4. Link the user to the database in hPanel (Manage → Add user to database)\n' +
            '  5. Try DB_HOST=127.0.0.1 OR DB_HOST=localhost (error above shows which host MySQL rejected)\n' +
            '  6. Set DEBUG_DB=true and DEBUG_DB_FULL=true temporarily to verify password in logs'
        );
    }

    return false;
}

poolPromise.testConnection = testConnection;

module.exports = new Proxy({}, {
    get(_target, prop) {
        if (prop === 'testConnection') return testConnection;
        const value = poolPromise[prop];
        if (typeof value === 'function') return value.bind(poolPromise);
        return value;
    }
});
