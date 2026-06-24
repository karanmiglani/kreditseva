require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const REQUIRED_VARS = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET_KEY'
];

function trimEnv(key) {
    const value = String(process.env[key] || '').trim();
    process.env[key] = value;
    return value;
}

function validateEnv() {
    ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_PORT', 'DB_SSL'].forEach(trimEnv);
    trimEnv('JWT_SECRET_KEY');
    trimEnv('PORT');

    const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (isProd && !process.env.PORT) {
        console.error('PORT is required in production');
        process.exit(1);
    }
}

validateEnv();

const port = Number(process.env.PORT) || 3000;

module.exports = {
    isProd,
    port,
    validateEnv
};
