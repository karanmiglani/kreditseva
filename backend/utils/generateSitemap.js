const fs = require('fs').promises;
const path = require('path');
const db = require('../config/db');

async function getPublishedBlogSlugs() {
    const [rows] = await db.query(
        `SELECT slug FROM blogs WHERE status = 'published' ORDER BY created_at DESC`
    );
    return rows.map((row) => row.slug);
}

async function generateSitemapXml() {
    const basePath = path.join(__dirname, '../../sitemap.xml');
    let xml = await fs.readFile(basePath, 'utf8');

    try {
        const slugs = await getPublishedBlogSlugs();
        if (slugs.length > 0) {
            const blogEntries = slugs.map((slug) =>
                `  <url><loc>https://kreditseva.com/blog/${slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
            ).join('\n');
            xml = xml.replace('</urlset>', `\n  <!-- Blog Posts -->\n${blogEntries}\n</urlset>`);
        }
    } catch (err) {
        console.error('Sitemap: could not fetch blog slugs, serving static sitemap only:', err.message);
    }

    return xml;
}

module.exports = { generateSitemapXml };
