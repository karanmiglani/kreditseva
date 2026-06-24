require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const REQUIRED_VARS = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET_KEY'
];

const { trimEnv, applyEnvAliases } = require('../utils/envHelpers');

function validateEnv() {
    applyEnvAliases();

    const dbKeys = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'DB_SSL', 'DB_SOCKET'];
    const rawBeforeTrim = {};

    if (process.env.DEBUG_DB === 'true') {
        dbKeys.forEach((key) => {
            rawBeforeTrim[key] = process.env[key];
        });
    }

    dbKeys.forEach(trimEnv);
    trimEnv('JWT_SECRET_KEY');
    trimEnv('PORT');

    if (process.env.DEBUG_DB === 'true') {
        rawBeforeTrim.DB_PASSWORD = rawBeforeTrim.DB_PASSWORD ?? process.env.DB_PASSWORD;
        const { logDbEnv } = require('../utils/dbDebug');
        logDbEnv(rawBeforeTrim);
    }

    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (isProd && !process.env.PORT) {
        console.error('PORT is required in production');
        process.exit(1);
    }

    if (isProd && process.env.DB_HOST === 'localhost') {
        console.warn(
            'Warning: DB_HOST is "localhost". ' +
            'On Hostinger this is usually correct if MySQL is on the same account — ' +
            'but DB_USER/DB_PASSWORD must be from hPanel → Databases, not your local dev values.'
        );
    }
}

validateEnv();

const port = Number(process.env.PORT) || 3000;

module.exports = {
    isProd,
    port,
    validateEnv
};
