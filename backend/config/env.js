require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const REQUIRED_VARS = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET_KEY'
];

function validateEnv() {
    const missing = REQUIRED_VARS.filter((key) => !String(process.env[key] || '').trim());

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY.trim();

    if (isProd && !String(process.env.PORT || '').trim()) {
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
