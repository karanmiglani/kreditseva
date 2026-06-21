const db = require('../config/db');

const getLatestBlogs = async(limit = 4, offset=0) => {

    const [blogs] = await db.query(`
        SELECT
            title,
            slug,
            featured_image,
            category,
            meta_desc,
            read_time,
            created_at
        FROM blogs
        WHERE status = 'published'
        ORDER BY created_at DESC
        LIMIT ? OFFSET  ?
    `, [limit,offset]);

    return blogs;

}


const featuredBlog = async() => {

    const [blogs] = await db.query(`
        SELECT
            title,
            slug,
            featured_image,
            category,
            meta_desc,
            read_time,
            created_at
        FROM blogs
        WHERE status = 'published'
        and
        DATE(created_at) = CURDATE()
        ORDER BY created_at DESC LIMIT 1

    `);

    return blogs;

}

const getBlog = async (slug) => {
    try {
        const sql = "Select blogs.*, admins.name from blogs inner join admins on blogs.author_id = admins.id where blogs.slug = ?";
        const [row] = await db.query(sql,[slug]);    
        return row;
    } catch (error) {
        console.log(error);
        
    }
    
    
}

const getRecentArticles = async() => {
    try {
        const sql = "SELECT title, slug, meta_desc, featured_image, category, created_at FROM blogs WHERE status = 'published' ORDER BY created_at DESC LIMIT 5"
        const [rows] = await db.query(sql);
        return rows;
    } catch (error) {
        console.log(error);
    }
}


const relatedArticle = async (slug) => {
    try {
        const sql = "SELECT title, slug, featured_image, category,meta_desc,read_time,created_at FROM blogs WHERE status = 'published' AND slug != ? ORDER BY created_at DESC LIMIT 3";
        const [rows] = await db.query(sql,[slug]);
        return rows;
    } catch (error) {
        console.log(error);
    }
}



module.exports = {
    getLatestBlogs, featuredBlog, getBlog, getRecentArticles, relatedArticle
};