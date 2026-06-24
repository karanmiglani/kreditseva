const path = require('path');
const { pagesDir } = require('../config/paths');

function wantsJson(req) {
    return req.path.startsWith('/api/')
        || req.path === '/load-more'
        || (req.headers.accept && req.headers.accept.includes('application/json'));
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.error(err);

    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            message: err.message || 'Invalid file upload'
        });
    }

    const status = err.status || err.statusCode || 500;
    const message = status >= 500
        ? 'Server error. Please try again later.'
        : (err.message || 'Request failed');

    if (wantsJson(req)) {
        return res.status(status).json({
            success: false,
            message
        });
    }

    if (status === 404) {
        return res.status(404).sendFile(path.join(pagesDir, '404.html'));
    }

    return res.status(status).send(message);
}

module.exports = errorHandler;
