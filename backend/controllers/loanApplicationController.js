const db = require('../config/db');


const saveLead = async (req, resp) => {
    console.log(req.body);

    try {
        const { name, phone_number, city, net_monthly_salary, product, occupation, panCard, total_outstanding_amount, source } = req.body;
        if (!name || !phone_number || !city || !net_monthly_salary || !product) {
            return resp.status(400).json({
                success: false,
                message: 'Required fields are mandatory.'
            })
        }
        const sql = "INSERT INTO loan_applications(name, phone_number, city, net_monthly_salary, product, occupation, pancard, total_outstanding_amount,source) values (?,?,?,?,?,?,?,?,?)";
        const [result] = await db.query(sql, [name, phone_number, city, net_monthly_salary, product, occupation, panCard, total_outstanding_amount, source]);
        if (result.affectedRows === 0) {
            return resp.status(400).json({
                success: false,
                message: 'Application Error, Please try again.'
            });
        }
        return resp.status(201).json({
            success: true,
            message: `Thanks for contacting KreditSeva for ${product}. Our team will call you shortly for further assictance `
        })

    } catch (error) {

        return resp.status(500).json({
            success: false,
            message: 'Server error, Please try again'
        })
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
    saveLead, getAllLeads, getAllCities, getAllProducts
}