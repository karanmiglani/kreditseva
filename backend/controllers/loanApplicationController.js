const db = require('../config/db');
const crypto = require('crypto');
const ExcelJS = require('exceljs');



const savePhoneNumber = async (req, resp) => {
    try {
        const phone_number = req.body?.phone_number?.trim();
        const product = req.body?.product?.trim();
        const phonRegex = /^[6-9][0-9]{9}$/;
        if (!phone_number || !phonRegex.test(phone_number) || !product) {
            return resp.status(400).json({
                success: false,
                message: 'Please enter valid phone number'
            })
        }
        // Check lead exist or not with phone number
        const lead = await checkLead(phone_number);
        let rawLeadId = lead?.rawLeadId;
        let expiryDate = lead?.expiryDate;
        if (!rawLeadId) {
            rawLeadId = crypto.randomUUID();
        }
        await insertLead(phone_number, product, rawLeadId, expiryDate);
        return resp.status(200).json({
            success: true,
            rawLeadId: rawLeadId,
            message: 'Mobile number saved, Click on apply button to continue..'
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success: false,
            message: 'Server error, Please try again..'
        })
    }

}

const checkLead = async (phoneNumber) => {
    try {
        const sql = "SELECT raw_lead_id, is_completed, expiry_date from raw_leads where is_completed = 0 and phone_number = ? and expiry_date > NOW() ORDER BY id DESC LIMIT 1";
        const [result] = await db.query(sql, [phoneNumber]);
        if (!result.length) { return null; }
        return {
            rawLeadId: result[0]?.raw_lead_id,
            expiryDate: result[0]?.expiry_date
        };
    } catch (error) {
        console.log(error);
        throw error;
    }
}
const insertLead = async (phoneNumber, product, raw_lead_id, expiry_date) => {
    try {
        let sql;
        let params;
        if (expiry_date) {
            sql = "INSERT INTO raw_leads(raw_lead_id, phone_number,  product, is_completed, expiry_date) values(?,?,?,0,?)";
            params = [raw_lead_id, phoneNumber, product, expiry_date]
        } else {
            sql = "INSERT INTO raw_leads(raw_lead_id, phone_number,  product, is_completed, expiry_date) values(?,?,?,0,DATE_ADD(NOW(), INTERVAL 30 DAY))";
            params = [raw_lead_id, phoneNumber, product]
        }
        const [resp] = await db.query(sql, params);
        return raw_lead_id;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

const saveLead = async (req, resp) => {
    const connection = await db.getConnection();
    try {
        const rawLeadId = req.body.rawLeadId?.trim();
        if (!rawLeadId) {
            return resp.status(400).json({
                success: false,
                rawLeadId: null,
                message: 'Session expired, Please enter mobile number to continue'
            });
        }
        const phone_number = await checkLeadId(rawLeadId);
        if (!phone_number) {
            return resp.status(400).json({
                success: false,
                rawLeadId: null,
                message: 'Session expired, Please enter mobile number to continue'
            })
        }
        // if phone number found insert in final lead

        await connection.beginTransaction();
        await insertFinalLead(connection, req, phone_number, rawLeadId);
        await updateRawLead(connection, rawLeadId);
        await connection.commit();
        return resp.status(200).json({
            success: true,
            message: 'Application submitted sucessfuly, Our expert will call you within 30 minutes.'
        })
    } catch (error) {
        await connection.rollback();
        console.log(error);
        return resp.status(error.status || 500).json({
            success: false,
            message: error.message || 'Server error, Please try again.'
        });
    } finally {
        connection.release();
    }
}

const checkLeadId = async (rawLeadId) => {
    try {
        const sql = "SELECT phone_number from raw_leads where raw_lead_id = ? and is_completed = 0 and expiry_date >= NOW() ORDER BY id DESC LIMIT 1";
        const [result] = await db.query(sql, [rawLeadId]);
        if (!result.length) return null;
        return result[0]?.phone_number;
    } catch (error) {
        console.error(error);
        throw error;
    }

}

const insertFinalLead = async (connection, req, phoneNumber, rawLeadId) => {
    try {
        const { name, city, net_monthly_salary, product, loan_amount, source } = req.body;
        if (!name  || !net_monthly_salary || !product || loan_amount === undefined  || !source || !rawLeadId || !phoneNumber) {
            throw {
                status: 400,
                message: 'All fields are required'
            }
        }
        const sql = "INSERT INTO loan_applications(raw_lead_id, name, phone_number, city, net_monthly_salary, product,loan_amount, source) value(?,?,?,?,?,?,?,?)";
        const [result] = await connection.query(sql, [rawLeadId, name, phoneNumber, city, net_monthly_salary, product, loan_amount, source]);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const updateRawLead = async (connection, rawLeadId) => {
    try {
        const sql = "UPDATE raw_leads set is_completed = 1 where raw_lead_id = ? ";
        const [result] = await connection.query(sql, [rawLeadId]);
    } catch (error) {
        console.log(error);
        throw error;
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
        if (city) {
            where += ' AND city = ?'
            params.push(city)
        }
        if (product) {
            where += ' AND product = ?';
            params.push(product);
        }

        if (search) {
            where += ` AND (name LIKE ? OR  phone_number  LIKE ?)`;
            const keyword = `%${search}%`
            params.push(keyword, keyword);
        }

        if (fromDate) {
            where += ' AND created_at >=?';
            params.push(`${fromDate} 00:00:00`);
        }
        if (toDate) {
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

const getAllCities = async (req, resp) => {
    try {
        const sql = "SELECT DISTINCT(city) from loan_applications where city IS NOT NULL ORDER BY city";
        const [result] = await db.query(sql);
        return resp.status(200).json({
            success: 'true',
            totalCities: result.length,
            cities: result
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success: false,
            message: 'Server error, Please try again.'
        })
    }
}

const getAllProducts = async (req, resp) => {
    try {
        const sql = "SELECT DISTINCT(product) from loan_applications";
        const [rows] = await db.query(sql);
        return resp.status(200).json({
            success: true,
            totalProucts: rows.length,
            products: rows
        })
    } catch (error) {
        console.error(error);
        return resp.status(500).json({
            success: false,
            message: 'Server error, Please try again.'
        })
    }
}


const downloadExcelReport = async (req, res) => {
    const { fromDate, toDate } = req.query;
    console.log(fromDate);
    console.log(toDate);
    try {

        const sql = `
            SELECT
                rl.phone_number,
                rl.product,
                la.name,
                la.city,
                la.net_monthly_salary,
                la.loan_amount,

                CASE
                    WHEN la.id IS NULL THEN 'Raw'
                    ELSE 'Completed'
                END AS status,

                rl.created_at

            FROM raw_leads rl

            LEFT JOIN loan_applications la
                ON la.raw_lead_id = rl.raw_lead_id

            WHERE rl.created_at >= ?
            AND rl.created_at < DATE_ADD(?, INTERVAL 1 DAY)

            ORDER BY rl.id DESC
        `;

        const [rows] = await db.query(sql, [fromDate, toDate]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Leads');

        worksheet.columns = [
            { header: 'Date', key: 'created_at', width: 25 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Contact', key: 'phone_number', width: 15 },
            { header: 'Product', key: 'product', width: 20 },
            { header: 'Salary', key: 'net_monthly_salary', width: 25 },
            { header: 'Loan Amount', key: 'loan_amount', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'City', key: 'city', width: 20 },
        ];

        const excelData = rows.map((row, index) => ({
            created_at: row.created_at,
            name: row.name,
            phone_number: String(row.phone_number),
            product: row.product,
            net_monthly_salary: row.net_monthly_salary,
            loan_amount: row.loan_amount ? Number(row.loan_amount) : null,
            status: row.status,
            city: row.city,
        }));
        worksheet.addRows(excelData);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=leads-report.xlsx'
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};


const contactUs = async(req, resp) => {
    const {name , email, phone_number,user_message} = req.body;
    if(!name || !email || !phone_number || !user_message) {
        return res.status(400).json({
            success : false,
            message : 'Please enter all details'
        });
    }
    try {
        const sql = "INSERT INTO contact_messages (name, email, phone_number, message) values(?,?,?,?)";
        const [result] = await db.query(sql,[name,email,phone_number,user_message]);
        return resp.status(200).json({
            success: true,
            message : 'Thanks for contacting us...Our team will call you shortly.'
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).status(500).json({
            success : false,
            message : 'Server error, Please try again'
        })
    }

}




module.exports = {
    saveLead, getAllLeads, getAllCities, getAllProducts, savePhoneNumber, downloadExcelReport, contactUs
}