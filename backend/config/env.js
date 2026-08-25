require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

const REQUIRED_VARS = [
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET_KEY'
];

/*
 * Warned about rather than fatal: the site must still boot and serve pages if
 * OTP is misconfigured. Reported at startup because the alternative is finding
 * out from a user who could not log in.
 */
const OTP_VARS = [
    'WHATSAPP_API_URL',
    'WHATSAPP_API_KEY',
    'WHATSAPP_USER_ID',
    'WHATSAPP_TEMPLATE_ID',
    'WHATSAPP_NUMBER_ID',
    'WHATSAPP_NUMBER'
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

    OTP_VARS.forEach(trimEnv);
    const missingOtp = OTP_VARS.filter((key) => !process.env[key]);
    if (missingOtp.length > 0) {
        console.warn(`[startup] WhatsApp OTP disabled — missing env: ${missingOtp.join(', ')}`);
    }
}

validateEnv();

const port = Number(process.env.PORT) || 3000;

module.exports = {
    isProd,
    port,
    validateEnv
};
