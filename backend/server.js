const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const { isProd, port } = require('./config/env');
const pageRoutes = require('./routes/pageRoutes');
const { generateSitemapXml } = require('./utils/generateSitemap');
const errorHandler = require('./midllewares/errorHandler');
const helmetConfig = require('./config/helmetConfig');
const { setNoStoreHeaders, setStaticAssetHeaders } = require('./config/cacheHeaders');

const assetVersion = process.env.ASSET_VERSION || String(Math.floor(Date.now() / 1000));
const staticOpts = isProd ? {
    etag: true,
    lastModified: true,
    maxAge: 0,
    setHeaders: setStaticAssetHeaders
} : {};

/**
 * Hostinger / local layouts differ:
 * - sibling of backend/nodejs: ../views/index.ejs
 * - inside app folder:        ./views/index.ejs
 * - cwd is repo root:         <cwd>/views/index.ejs
 */
function resolveProjectPath(...segments) {
    const candidates = [
        path.join(__dirname, '..', ...segments),
        path.join(__dirname, ...segments),
        path.join(process.cwd(), ...segments),
        path.join(process.cwd(), '..', ...segments)
    ];
    return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

const viewsDir = resolveProjectPath('views');
const cssDir = resolveProjectPath('css');
const jsDir = resolveProjectPath('js');
const imagesDir = resolveProjectPath('images');
const adminDir = resolveProjectPath('admin');
const pagesDir = resolveProjectPath('pages');
const indexViewPath = path.join(viewsDir, 'index.ejs');

console.log('[paths] __dirname =', __dirname);
console.log('[paths] cwd       =', process.cwd());
console.log('[paths] viewsDir  =', viewsDir, fs.existsSync(viewsDir) ? 'OK' : 'MISSING');
console.log('[paths] index.ejs =', indexViewPath, fs.existsSync(indexViewPath) ? 'OK' : 'MISSING');
if (fs.existsSync(viewsDir)) {
    try {
        console.log('[paths] views contents =', fs.readdirSync(viewsDir).join(', '));
    } catch (err) {
        console.error('[paths] cannot read viewsDir:', err.message);
    }
}

const app = express();

if (isProd) {
    app.set('trust proxy', 1);
}

// Canonical host — www → apex (kreditseva.com)
if (isProd) {
    app.use((req, resp, next) => {
        if (req.hostname === 'www.kreditseva.com') {
            return resp.redirect(301, `https://kreditseva.com${req.originalUrl}`);
        }
        next();
    });
}

app.disable('x-powered-by');

const allowedOrigins = [
    'https://www.kreditseva.com',
    'https://kreditseva.com',
    'https://kreditseva.onrender.com',
    'http://localhost:3000'
];

if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach((origin) => {
        const trimmed = origin.trim();
        if (trimmed && !allowedOrigins.includes(trimmed)) {
            allowedOrigins.push(trimmed);
        }
    });
}

app.use(helmet(helmetConfig));
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const autRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const dashBoardRoutes = require('./routes/dashboardRoutes');
const leadRoutes = require('./routes/loanApplicationRoutes');
const partnerRoutes = require('./routes/partnerRoutes');

// Static files — revalidate on every deploy (no long-lived CDN cache)
app.use('/css', express.static(cssDir, staticOpts));
app.use('/js', express.static(jsDir, staticOpts));
app.use('/images', express.static(imagesDir, staticOpts));
app.use('/admin', express.static(adminDir, {
    index: false,
    ...staticOpts
}));

app.set('view engine', 'ejs');
app.set('views', viewsDir);
app.use((req, resp, next) => {
    resp.locals.assetVersion = assetVersion;
    resp.locals.siteUrl = 'https://kreditseva.com';
    next();
});

// Health check (for Render / load balancers)
app.get('/health', (req, resp) => {
    resp.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        paths: {
            dirname: __dirname,
            cwd: process.cwd(),
            viewsDir,
            indexEjs: fs.existsSync(indexViewPath),
            viewsListing: fs.existsSync(viewsDir) ? fs.readdirSync(viewsDir) : []
        }
    });
});

app.get('/favicon.ico', (req, resp) => {
    resp.redirect(301, '/images/favicon.svg');
});

app.get('/sitemap.xml', async (req, resp, next) => {
    try {
        const xml = await generateSitemapXml();
        setNoStoreHeaders(resp);
        resp.setHeader('Content-Type', 'application/xml');
        resp.send(xml);
    } catch (err) {
        next(err);
    }
});

app.get('/robots.txt', (req, resp) => {
    resp.setHeader('Content-Type', 'text/plain');
    resp.send(
        'User-agent: *\n' +
        'Allow: /\n' +
        'Disallow: /pages/\n' +
        'Disallow: /admin\n' +
        'Disallow: /api/\n' +
        'Sitemap: https://kreditseva.com/sitemap.xml\n'
    );
});

app.use(pageRoutes);
app.use('/api/auth', autRoutes);
app.use('/api/blog/', blogRoutes);
app.use('/api/dashboard', dashBoardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/partner', partnerRoutes);

// 404 handler — must be after all routes
app.use((req, resp) => {
    setNoStoreHeaders(resp);
    const notFoundPage = path.join(pagesDir, '404.html');
    if (fs.existsSync(notFoundPage)) {
        return resp.status(404).sendFile(notFoundPage);
    }
    resp.status(404).send('Not found');
});

// Global error handler — must be last
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`KreditSeva server running on port ${port} (${isProd ? 'production' : 'development'})`);
});

server.on('error', (err) => {
    console.error('Listen error:', err);
    process.exit(1);
});

function shutdown(signal) {
    console.log(`${signal} received — closing server`);
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
