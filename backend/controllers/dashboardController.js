const db = require('../config/db');

const getStats = async(req, resp) => {
    try {
        const sql = "SELECT COUNT(*) as total from loan_applications";
        const sql_1 = "SELECT COUNT(*) as total from blogs";
        const sql_2 = "SELECT COUNT(*) as draft from blogs where status = 'draft' ";
        const sql_3 = "SELECT COUNT(*) as published from blogs where status = 'published' ";
        const sql_4 = `SELECT * FROM loan_applications WHERE DATE(created_at) = CURDATE()`;           
        const [total_applications, totalBlogs, draftBlogs, publishedBlogs,blogs] = await Promise.all([
            db.query(sql), db.query(sql_1), db.query(sql_2), db.query(sql_3), db.query(sql_4)
        ])
        return resp.status(200).json({
            success : true,
            message : 'Rows found',
            totalApplication : total_applications[0][0].total,
            totalBlogs : totalBlogs[0][0].total,
            draft : draftBlogs[0][0].draft,
            published : publishedBlogs[0][0].published,
            leads : blogs[0]
        })

    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again...'
        })
    }
}


module.exports = {getStats}