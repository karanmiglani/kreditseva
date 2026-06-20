const db = require('../config/db');
const ExcelJS = require('exceljs');

const getAllContactMessages = async (req, resp) => {
    try {
        const { fromDate, toDate } = req.query;
        let sql = 'SELECT * FROM contact_messages';
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
            messages: rows
        });
    } catch (error) {
        console.error(error);
        return resp.status(500).json({ success: false, message: 'Server error.' });
    }
};


const downloadContactExcel = async (req, res) => {
    const { fromDate, toDate } = req.query;
    try {
        let sql = 'SELECT * FROM contact_messages';
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
        const worksheet = workbook.addWorksheet('Contact Messages');

        worksheet.columns = [
            { header: 'Date',         key: 'created_at',   width: 22 },
            { header: 'Name',         key: 'name',         width: 22 },
            { header: 'Mobile',       key: 'phone_number', width: 15 },
            { header: 'Email',        key: 'email',        width: 28 },
            { header: 'Message',      key: 'message',      width: 50 },
        ];

        worksheet.addRows(rows.map(r => ({
            created_at:   r.created_at,
            name:         r.name || '',
            phone_number: String(r.phone_number || ''),
            email:        r.email || '',
            message:      r.message || '',
        })));

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=contact-messages.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};


module.exports = { getAllContactMessages, downloadContactExcel };
