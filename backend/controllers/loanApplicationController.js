const db = require('../config/db');



const savePhoneNumber = async(req, resp) => {
    const connection = await db.getConnection();
    try {
          const phone_number = req.body.phone_number.trim();
          const product = req.body.product.trim();
          const phoneNumberRegex = /^[6-9][0-9]{9}$/;
          if(!phone_number || phone_number.length < 10 || !phoneNumberRegex.test(phone_number)) {
            return resp.status(400).json({
            success : false,
            message : 'Please enter valid mobile number'
        });
    }

    // 1. user check kr exist krta h ya nahi
    const q1 = "SELECT id, phone_number, raw_lead_id,product,expiry_date from raw_leads where phone_number =?  and is_completed = 0 and expiry_date >= NOW() ORDER BY id DESC  LIMIT 1";
    const [results] = await db.query(q1,[phone_number, product]);
    // result is empty insert in table
    if(results.length === 0){
        
        await connection.beginTransaction();
        const q2 = "INSERT INTO raw_leads(phone_number, product, expiry_date) values (?,?,DATE_ADD(NOW(), INTERVAL 30 DAY))";
        const [row] = await db.query(q2,[phone_number, product]);
        let insertId = row.insertId;
        const q3 = 'UPDATE  raw_leads set raw_lead_id  = ? where id=?';
        const [res] = await db.query(q3,[insertId,insertId]);
        await connection.commit();
        return resp.status(201).json({
            success : true,
            rawLeadID : insertId,
            message : 'Mobile number saved click on Check Eligibilty button to continue.'
        })
    }
    // Result found
    console.log(results);
    const q4 =  "INSERT INTO raw_leads(raw_lead_id, phone_number, product, expiry_date) values (?,?,?,?)";
    await db.query(q4,[results[0].raw_lead_id,phone_number, product, results[0].expiry_date] )
    return resp.status(200).json({
        success : true,
        rawLeadID : results[0].raw_lead_id,
        message : 'Mobile number saved click on Check Eligibilty button to continue'
    })
    } catch (error) {
        console.error(error);
        resp.status(500).json({
            success : false,
            message : 'Server error, Please try again...'
        })   
    }finally{
        connection.release();
    }
}


const saveLead = async (req, resp) => {
    console.log(req.body);

    try {
        const { name, phone_number, city, net_monthly_salary, product,loan_amount, source } = req.body;
        if (!name || !phone_number || !city || !net_monthly_salary || !product || !loan_amount) {
            return resp.status(400).json({
                success: false,
                message: 'Required fields are mandatory.'
            })
        }

        const sql = 'SELECT  raw_lead_id from raw_leads where phone_number = ? and is_completed =? and expiry_date >= NOW() ORDER BY id LIMIT 1';
        const [rows] = await db.query(sql,[phone_number,false]);
        const raw_lead_id = rows[0].raw_lead_id;
        conn = await db.getConnection();
        await conn.beginTransaction();
        if(rows.length > 0){
            const sql_1 = "INSERT INTO loan_applications(raw_lead_id,name,phone_number,city,net_monthly_salary,product,loan_amount,source) VALUES(?,?,?,?,?,?,?,?);"
            const [result_1] = await conn.query(sql_1,[raw_lead_id,name,phone_number,city,net_monthly_salary,product,loan_amount,source]);
            const sql_2 = "UPDATE raw_leads set is_completed = 1 where raw_lead_id = ?";
            const [result_2]  = await conn.query(sql_2, [raw_lead_id]);
            await conn.commit();
            return resp.status(200).json({
                success : true,
                message : 'Application submitted, Our represenentative will call you soon.'
            })
        }
    } catch (error) {
        await conn.rollback();
        console.error(error);
        return resp.status(500).json({
            success: false,
            message: 'Server error, Please try again'
        })
    }finally{
        conn.release();
    }

}

const capitalizeWords = (str) =>
    str ? str.replace(/\b\w/g, c => c.toUpperCase()) : '-';


const getAllLeads = async (req, resp) => {
    try {
        const draw = Number(req.query.draw || 1);
        const start = Number(req.query.start || 0);
        const length = Number(req.query.length || 25);

        const city = req.query.city || '';
        const product = req.query.product || '';
        const search = (req.query['search[value]'] || '').trim();
        const fromDate = req.query.fromDate || '';
        const toDate = req.query.toDate || '';
        let where = 'WHERE 1=1';
        let params = [];
        if(city){
            where += ' AND city = ?'
            params.push(city)
        }
        if(product){
            where += ' AND product = ?';
            params.push(product);
        }

        if(search){
            where += ` AND (name LIKE ? OR  phone_number  LIKE ?)`;
            const keyword = `%${search}%`
            params.push(keyword, keyword);
        }

        if(fromDate){
            where += ' AND created_at >=?';
            params.push(`${fromDate} 00:00:00`);
        }
        if(toDate){
            where += ' AND created_at <=? ';
            params.push(`${toDate} 23:59:59`)
        }
        // totalCout
        const [[countResult]] = await db.query(`SELECT COUNT(*) as total FROM loan_applications`);
        const total = countResult.total;
        const [[filteredCountResult]] = await db.query(`SELECT COUNT(*) as total from loan_applications ${where}`, params)
        const filteredResult = filteredCountResult.total;

        // paginatedData
        const [rows] = await db.query(`SELECT * from loan_applications ${where} ORDER BY id DESC LIMIT ? OFFSET ?`, [...params, length, start]);
        const data = rows.map((row, index) => [
            start + index + 1,
            capitalizeWords(row.name) || '-',
            row.phone_number || '-',
            capitalizeWords(row.city) || '-',
            row.product
                ? row.product.replace(/-/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                : '-',
            row.occupation
                ? row.occupation.replace(/-/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                : '-',
            row.net_monthly_salary || '-',
            row.pancard || '-',
            row.total_outstanding_amount
                ? `₹${Number(row.total_outstanding_amount).toLocaleString('en-IN')}`
                : '-',
            new Date(row.created_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        ]);
        resp.status(200).json({
            draw,
            recordsTotal: total,
            recordsFiltered: filteredResult,
            data
        })
    } catch (error) {
        console.error(error);
        resp.status(500).json({
            darw: 1,
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
        })
    }
}

const getAllCities = async(req, resp) => {
    try {
        const sql = "SELECT DISTINCT(city) from loan_applications where city IS NOT NULL ORDER BY city";
        const [result] = await db.query(sql);
        return resp.status(200).json({
            success : 'true',
            totalCities : result.length,
            cities : result
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again.'
        })
    }
}

const getAllProducts = async(req,resp) => {
    try {
        const sql = "SELECT DISTINCT(product) from loan_applications";
        const [rows] = await db.query(sql);
        return resp.status(200).json({
            success : true,
            totalProucts : rows.length,
            products : rows
        })
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again.'
        })
    }
}

module.exports = {
    saveLead, getAllLeads, getAllCities, getAllProducts, savePhoneNumber
}