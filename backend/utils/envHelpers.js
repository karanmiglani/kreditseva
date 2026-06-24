function normalizeEnvValue(value) {
    let str = String(value ?? '').trim();
    if (
        (str.startsWith('"') && str.endsWith('"')) ||
        (str.startsWith("'") && str.endsWith("'"))
    ) {
        str = str.slice(1, -1).trim();
    }
    return str;
}

function trimEnv(key) {
    const value = normalizeEnvValue(process.env[key]);
    process.env[key] = value;
    return value;
}

function applyEnvAliases() {
    if (!process.env.DB_HOST && process.env.MYSQL_HOST) {
        process.env.DB_HOST = process.env.MYSQL_HOST;
    }
    if (!process.env.DB_USER && process.env.MYSQL_USER) {
        process.env.DB_USER = process.env.MYSQL_USER;
    }
    if (!process.env.DB_PASSWORD && process.env.MYSQL_PASSWORD) {
        process.env.DB_PASSWORD = process.env.MYSQL_PASSWORD;
    }
    if (!process.env.DB_NAME && process.env.MYSQL_DATABASE) {
        process.env.DB_NAME = process.env.MYSQL_DATABASE;
    }
}

module.exports = {
    normalizeEnvValue,
    trimEnv,
    applyEnvAliases
};
