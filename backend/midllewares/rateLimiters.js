const rateLimit = require('express-rate-limit');

const jsonMessage = (message) => ({
    success: false,
    message
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonMessage('Too many login attempts. Please try again in 15 minutes.')
});

const formLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: jsonMessage('Too many submissions. Please try again later.')
});

module.exports = {
    loginLimiter,
    formLimiter
};
