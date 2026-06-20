const db = require('../config/db');
const ExcelJS = require('exceljs');

const savePartner = async (req, resp) => {
    try {
        const { full_name, mobile_number, location, firm_name, dsa_type } = req.body;

        if (!full_name || !mobile_number || !location || !firm_name || !dsa_type) {
            return resp.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        const phoneRegex = /^[6-9][0-9]{9}$/;
        if (!phoneRegex.test(mobile_number.trim())) {
            return resp.status(400).json({
                success: false,
                message: 'Please enter a valid 10-digit mobile number.'
            });
        }

        const sql = `INSERT INTO dsa_partners (full_name, mobile_number, location, firm_name, dsa_type)
                     VALUES (?, ?, ?, ?, ?)`;

        await db.query(sql, [
            full_name.trim(),
            mobile_number.trim(),
            location.trim(),
            firm_name.trim(),
            dsa_type
        ]);

        return resp.status(201).json({
            success: true,
            message: 'Partner registration successful! Our team will contact you within 48 hours.'
        });

    } catch (err) {
        console.error(err);
        return resp.status(500).json({
            success: false,
            message: 'Server error, please try again.'
        });
    }
};


const getAllPartners = async (req, resp) => {
    try {
        const { fromDate, toDate } = req.query;
        let sql = 'SELECT * FROM dsa_partners';
        const params = [];

        if (fromDate && toDate) {
            sql += ' WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)';
            params.push(fromDate, toDate);
        } else if (fromDate) {
            sql += ' WHERE created_at >= ?';
            params.push(fromDate);
        } else if (toDate) {
            sql += ' WHERE created_at < DATE_ADD(?, INTERVAL 1 DAY)';
            params.push(toDate);
        }

        sql += ' ORDER BY created_at DESC';

        const [rows] = await db.query(sql, params);
        return resp.status(200).json({
            success: true,
            total: rows.length,
            partners: rows
        });
    } catch (err) {
        console.error(err);
        return resp.status(500).json({ success: false, message: 'Server error.' });
    }
};


const downloadPartnerExcel = async (req, res) => {
    const { fromDate, toDate } = req.query;
    try {
        let sql = 'SELECT * FROM dsa_partners';
        const params = [];

        if (fromDate && toDate) {
            sql += ' WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)';
            params.push(fromDate, toDate);
        } else if (fromDate) {
            sql += ' WHERE created_at >= ?';
            params.push(fromDate);
        } else if (toDate) {
            sql += ' WHERE created_at < DATE_ADD(?, INTERVAL 1 DAY)';
            params.push(toDate);
        }

        sql += ' ORDER BY created_at DESC';

        const [rows] = await db.query(sql, params);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Partner Leads');

        worksheet.columns = [
            { header: 'Date',          key: 'created_at',    width: 22 },
            { header: 'Full Name',     key: 'full_name',     width: 22 },
            { header: 'Mobile',        key: 'mobile_number', width: 15 },
            { header: 'Location',      key: 'location',      width: 22 },
            { header: 'Firm Name',     key: 'firm_name',     width: 28 },
            { header: 'DSA Type',      key: 'dsa_type',      width: 15 },
        ];

        worksheet.addRows(rows.map(r => ({
            created_at:    r.created_at,
            full_name:     r.full_name || '',
            mobile_number: String(r.mobile_number || ''),
            location:      r.location || '',
            firm_name:     r.firm_name || '',
            dsa_type:      r.dsa_type || '',
        })));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=partner-leads.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = { savePartner, getAllPartners, downloadPartnerExcel };
