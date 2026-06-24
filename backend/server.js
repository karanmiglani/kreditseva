const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const cookieParser = require('cookie-parser');

const { isProd, port } = require('./config/env');
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
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/images', express.static(path.join(__dirname, '../images')));
app.use('/admin', express.static(path.join(__dirname, '../admin'), {
    index: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

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
    resp.status(404).sendFile(path.join(__dirname, '../pages/404.html'));
});

// Global error handler — must be last
app.use(errorHandler);

const server = app.listen(port, async () => {
    console.log(`KreditSeva server running on port ${port} (${isProd ? 'production' : 'development'})`);
    const db = require('./config/db');
    const ok = await db.testConnection();
    if (!ok && isProd) {
        console.error('Server started but database is unreachable — fix DB env vars and redeploy.');
    } else if (ok) {
        console.log('Database connection OK');
    }
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
