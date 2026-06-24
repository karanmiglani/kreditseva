const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();
const path = require('path');
const fs = require('fs');
const pageRoutes = require('./routes/pageRoutes');
const app = express();
const cookieParser = require('cookie-parser');
app.use(helmet({
  contentSecurityPolicy: false,  // CSP off — static assets aur CDN links block ho sakti hain
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: ['https://kreditseva.onrender.com', 'https://www.kreditseva.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const autRoutes = require('./routes/authRoutes');
const blogRoutes = require('./routes/blogRoutes');
const dashBoardRoutes = require('./routes/dashboardRoutes');
const leadRoutes = require('./routes/loanApplicationRoutes');
const partnerRoutes = require('./routes/partnerRoutes');


// Static files

app.use('/css', express.static(path.join(__dirname,'../css')));
app.use('/js', express.static(path.join(__dirname,'../js')));
app.use('/images', express.static(path.join(__dirname,'../images')));
app.use('/admin', express.static(path.join(__dirname,'../admin'), {
    index : false
}));

app.set('view engine' , 'ejs');
app.set('views', path.join(__dirname,'../views'));
app.use(pageRoutes);
app.use('/api/auth',autRoutes);
app.use('/api/blog/', blogRoutes);
app.use('/api/dashboard',dashBoardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/partner', partnerRoutes);


const port = process.env.PORT;


// Sitemap & robots
app.get('/sitemap.xml', (req, resp) => {
    resp.setHeader('Content-Type', 'application/xml');
    resp.sendFile(path.join(__dirname, '../sitemap.xml'));
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

// 404 handler — must be after all routes
app.use((req, resp) => {
    resp.status(404).sendFile(path.join(__dirname, '../pages/404.html'));
});

const server = app.listen(port,() => {
    console.log("Server runing at port 3000...");
})

server.on('error', (err) => {
    console.error('Listen Error:', err);
});