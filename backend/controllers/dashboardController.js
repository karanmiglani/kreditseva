const db = require('../config/db');

const getStats = async(req, resp) => {
    try {
        const sql = "SELECT COUNT(*) as total from loan_applications";
        const sql_1 = "SELECT COUNT(*) as total from blogs";
        const sql_2 = "SELECT COUNT(*) as draft from blogs where status = 'draft' ";
        const sql_3 = "SELECT COUNT(*) as published from blogs where status = 'published' ";
        const sql_4 = `SELECT COUNT(DISTINCT(raw_lead_id)) as total FROM raw_leads WHERE DATE(created_at) >= CURDATE() AND DATE(created_at) < CURDATE() + INTERVAL 1 DAY `;           
        const sql_5 =  `SELECT COUNT(DISTINCT(raw_lead_id)) as total  from raw_leads where DATE(created_at) >= CURDATE() - INTERVAL 1 DAY and created_at < CURDATE()`;
        const sql_6 = `SELECT COUNT(DISTINCT(raw_lead_id)) as total from raw_leads where created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') and created_at < DATE_FORMAT(CURDATE() + INTERVAL 1 MONTH, '%Y-%m-01')`; 
        const sql_7 = `SELECT rl.id,rl.raw_lead_id,rl.phone_number,rl.product,rl.is_completed,rl.created_at,la.name,la.city,la.net_monthly_salary,la.loan_amount
        FROM raw_leads rl
         LEFT JOIN 
         loan_applications la 
         ON 
         la.raw_lead_id = rl.raw_lead_id  WHERE rl.created_at >= CURDATE() AND rl.created_at < CURDATE() + INTERVAL 1 DAY
         ORDER BY rl.id DESC;`
        const [total_applications, totalBlogs, draftBlogs, publishedBlogs, todaysLeads,yesterdaysLeads, thisMothLeads,leads] = await Promise.all([
            db.query(sql), db.query(sql_1), db.query(sql_2), db.query(sql_3), db.query(sql_4), db.query(sql_5), db.query(sql_6), db.query(sql_7)
        ])
        return resp.status(200).json({
            success : true,
            message : 'Rows found',
            totalApplication : total_applications[0][0].total,
            totalBlogs : totalBlogs[0][0].total,
            draft : draftBlogs[0][0].draft,
            published : publishedBlogs[0][0].published,
            todaysLeads : todaysLeads[0][0].total,
            yesterdaysLeads : yesterdaysLeads[0][0].total,
            thisMonthLead : thisMothLeads[0][0].total,
            leads : leads[0]
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