const isProd = process.env.NODE_ENV === 'production';

const cspDirectives = {
    defaultSrc: ["'self'"],
    // Turnstile widget script lives on challenges.cloudflare.com
    scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://cdn.jsdelivr.net',
        'https://challenges.cloudflare.com'
    ],
    scriptSrcAttr: ["'unsafe-inline'"],
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
    // Browser talks to Turnstile challenge endpoints
    connectSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://challenges.cloudflare.com'
    ],
    // Widget iframe
    frameSrc: ["'self'", 'https://challenges.cloudflare.com'],
    objectSrc: ["'self'"],
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
