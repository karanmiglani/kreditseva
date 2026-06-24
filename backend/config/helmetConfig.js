const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
        'https://cdn.jsdelivr.net'
    ],
    fontSrc: [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdnjs.cloudflare.com',
        'data:'
    ],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
};

if (isProd) {
    cspDirectives.upgradeInsecureRequests = [];
}

module.exports = {
    contentSecurityPolicy: {
        directives: cspDirectives
    },
    crossOriginEmbedderPolicy: false
};
