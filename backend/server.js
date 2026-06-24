const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const { isProd, port } = require('./config/env');
const paths = require('./config/paths');
const pageRoutes = require('./routes/pageRoutes');
const { generateSitemapXml } = require('./utils/generateSitemap');
const errorHandler = require('./midllewares/errorHandler');
const helmetConfig = require('./config/helmetConfig');

const app = express();

if (isProd) {
    app.set('trust proxy', 1);
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

// Static files
app.use('/css', express.static(paths.cssDir));
app.use('/js', express.static(paths.jsDir));
app.use('/images', express.static(paths.imagesDir));
app.use('/admin', express.static(paths.adminDir, {
    index: false
}));

app.set('view engine', 'ejs');
app.set('views', paths.viewsDir);

// Health check (for Render / load balancers)
app.get('/health', (req, resp) => {
    resp.status(200).json({
        status: 'ok',
        uptime: Math.floor(process.uptime())
    });
});

app.get('/favicon.ico', (req, resp) => {
    resp.redirect(301, '/images/credit-gauge.svg');
});

app.get('/sitemap.xml', async (req, resp, next) => {
    try {
        const xml = await generateSitemapXml();
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
        'Sitemap: https://www.kreditseva.com/sitemap.xml\n'
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
    resp.status(404).sendFile(path.join(paths.pagesDir, '404.html'));
});

// Global error handler — must be last
app.use(errorHandler);

const server = app.listen(port, () => {
    console.log(`KreditSeva server running on port ${port} (${isProd ? 'production' : 'development'})`);
    console.log(`App root: ${paths.appRoot}`);
    console.log(`Views: ${paths.viewsDir}`);
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
