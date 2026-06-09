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
        // totalCout
        const [countResult] = await db.query('SELECT COUNT(*) as total FROm loan_applications');
        const total = countResult[0].total;

        // paginatedData
        const [rows] = await db.query(`SELECT * from loan_applications ORDER BY id DESC LIMIT ? OFFSET ?`, [length, start]);
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
            recordsFiltered: total,
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

module.exports = {
    saveLead, getAllLeads
}