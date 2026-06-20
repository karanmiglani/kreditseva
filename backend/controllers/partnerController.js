const db = require('../config/db');

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

        const [result] = await db.query(sql, [
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
        const [rows] = await db.query(
            'SELECT * FROM dsa_partners ORDER BY created_at DESC'
        );
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


module.exports = { savePartner, getAllPartners };
