const path = require('path');
const fs = require('fs');

function findAppRoot() {
    if (process.env.APP_ROOT) {
        return path.resolve(process.env.APP_ROOT);
    }

    const backendDir = path.join(__dirname, '..');
    const candidates = [
        path.join(backendDir, '..'),
        backendDir
    ];

    for (const root of candidates) {
        if (fs.existsSync(path.join(root, 'views', 'index.ejs'))) {
            return root;
        }
    }

    return path.join(backendDir, '..');
}

const appRoot = findAppRoot();

module.exports = {
    appRoot,
    viewsDir: path.join(appRoot, 'views'),
    pagesDir: path.join(appRoot, 'pages'),
    cssDir: path.join(appRoot, 'css'),
    jsDir: path.join(appRoot, 'js'),
    imagesDir: path.join(appRoot, 'images'),
    adminDir: path.join(appRoot, 'admin'),
    protectedDir: path.join(appRoot, 'protected'),
    sitemapPath: path.join(appRoot, 'sitemap.xml')
};
