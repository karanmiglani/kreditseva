function maskSecret(value) {
    const str = String(value || '');
    if (!str) return '(empty)';
    if (str.length <= 4) return '*'.repeat(str.length);
    return `${str.slice(0, 2)}${'*'.repeat(str.length - 4)}${str.slice(-2)}`;
}

function secretDiagnostics(label, raw, trimmed) {
    const rawStr = String(raw ?? '');
    const trimmedStr = String(trimmed ?? '');

    console.log(`[DB DEBUG] ${label}:`);
    console.log(`  raw length: ${rawStr.length}, trimmed length: ${trimmedStr.length}`);
    console.log(`  had leading/trailing spaces: ${rawStr !== trimmedStr}`);
    console.log(`  masked: ${maskSecret(trimmedStr)}`);

    if (process.env.DEBUG_DB_FULL === 'true') {
        console.log(`  FULL VALUE (remove DEBUG_DB_FULL after debugging): "${trimmedStr}"`);
    }

    if (rawStr !== trimmedStr) {
        console.log(`  raw JSON: ${JSON.stringify(rawStr)}`);
    }
}

function logDbEnv(rawEnv) {
    console.log('========== DB ENV DEBUG (set DEBUG_DB=false when done) ==========');
    console.log('[DB DEBUG] NODE_ENV:', process.env.NODE_ENV || '(not set)');
    console.log('[DB DEBUG] DB_HOST:', process.env.DB_HOST || '(empty)');
    console.log('[DB DEBUG] DB_PORT:', process.env.DB_PORT || '3306 (default)');
    console.log('[DB DEBUG] DB_USER:', process.env.DB_USER || '(empty)');
    console.log('[DB DEBUG] DB_NAME:', process.env.DB_NAME || '(empty)');
    console.log('[DB DEBUG] DB_SSL:', process.env.DB_SSL || '(not set / false)');

    secretDiagnostics('DB_PASSWORD', rawEnv.DB_PASSWORD, process.env.DB_PASSWORD);

    console.log('[DB DEBUG] pool will connect to:', {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true'
    });
    console.log('=================================================================');
}

module.exports = {
    logDbEnv,
    maskSecret
};
