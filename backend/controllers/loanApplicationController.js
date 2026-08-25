const db = require('../config/db');
const crypto = require('crypto');
const ExcelJS = require('exceljs');
const { sendWhatsappOtp } = require('../services/whatsAppService');



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
    const rawLeadId = req.body.rawLeadId?.trim();
    const otp = req.body.otp?.trim();
    if (!rawLeadId) {
        return resp.status(400).json({
            success: false,
            rawLeadId: null,
            message: 'Session expired, Please enter mobile number to continue'
        });
    }
    if (!otp) {
        return resp.status(400).json({
            success: false,
            message: 'Please enter 6 digit code sent to your WhatsApp account to continue'
        });
    }

    /*
     * The form is validated BEFORE the OTP is checked. Verifying first meant a
     * rejected field burned the code, forcing the user to spend another send
     * on a mistake the server could have caught for free.
     */
    const validation = validateLeadInput(req.body);
    if (!validation.valid) {
        return resp.status(400).json({
            success: false,
            message: validation.message
        });
    }

    const connection = await db.getConnection();
    try {
        const phone_number = await checkLeadId(rawLeadId);
        if (!phone_number) {
            return resp.status(400).json({
                success: false,
                rawLeadId: null,
                message: 'Session expired, Please enter mobile number to continue'
            })
        }

        await connection.beginTransaction();

        /*
         * Verified inside the transaction: the OTP is only marked used if the
         * lead insert below actually commits.
         */
        const verifiedOtp = await verifyOtp(otp, rawLeadId, connection);
        if (!verifiedOtp.success) {
            await connection.rollback();
            return resp.status(verifiedOtp.httpStatus || 400).json({
                success: false,
                message: verifiedOtp.message
            });
        }

        // if phone number found insert in final lead
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

/*
 * Field checks live here, separate from the insert, so saveLead can run them
 * before the OTP is touched. PAN stays optional; only its format is checked.
 */
const validateLeadInput = (body) => {
    const { name, net_monthly_salary, product, loan_amount, source, pancard } = body;
    if (!name || !net_monthly_salary || !product || loan_amount === undefined || !source) {
        return { valid: false, message: 'All fields are required' };
    }
    if (pancard) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(String(pancard).trim().toUpperCase())) {
            return { valid: false, message: 'Invalid PAN card format. Expected format: ABCDE1234F' };
        }
    }
    return { valid: true };
}

const insertFinalLead = async (connection, req, phoneNumber, rawLeadId) => {
    try {
        const { name, city, net_monthly_salary, product, loan_amount, source, occupation, pancard } = req.body;
        const sql = `INSERT INTO loan_applications
            (raw_lead_id, name, phone_number, city, net_monthly_salary, product, loan_amount, source, occupation, pancard)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await connection.query(sql, [
            rawLeadId, name, phoneNumber, city, net_monthly_salary, product, loan_amount, source,
            occupation || null,
            pancard ? pancard.trim().toUpperCase() : null
        ]);
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const updateRawLead = async (connection, rawLeadId) => {
    try {
        const sql = "UPDATE raw_leads set is_completed = 1, otp_verified = 1 where raw_lead_id = ? ";
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
            draw: 1,
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
            success: true,
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
        return resp.status(400).json({
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
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again'
        })
    }

}


const sendOtp = async(req, resp) => {
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

        const [rateLimitRows] = await db.query("SELECT COUNT(*) as todayOtpCount, MAx(created_at) as lastOtpSentAt from otp_verifications where phone = ? AND created_at >= CURDATE()",[phone_number]);
        const todayOtpCount = Number(rateLimitRows[0]?.todayOtpCount || 0);
        const lastOtpSentAt = rateLimitRows[0]?.lastOtpSentAt;
        if(todayOtpCount >= 5){
            return resp.status(429).json({
                success : false,
                rateLimited : true,
                type : "daily_limit",
                message : `Todays's OTP limit has been reached. Please try again tomorrow.`
            })
        }

        if(lastOtpSentAt){
            const lastSentTime = new Date(lastOtpSentAt).getTime();
            const elapsedSeconds = (Date.now() - lastSentTime)/1000;
            if(elapsedSeconds < 90){
                const retryAfter = Math.ceil(90 - elapsedSeconds);
                return resp.status(429).json({
                    success : false,
                    rateLimited : true,
                    type : "cooldown",
                    retryAfter,
                    message: `Please wait ${retryAfter} seconds before requesting another OTP.`
                })
            }
        }


        // if phone number found generate otp
        const otp = crypto.randomInt(100000, 1000000).toString( );

        /*
         * The attempt is recorded first, then the provider is called. Doing it
         * the other way round meant a provider outage produced no row at all,
         * so neither the cooldown nor the daily cap above could see the traffic.
         */
        const otpId = await insertOtp(otp, phone_number, rawLeadId);

        try {
            await sendWhatsappOtp(phone_number, otp);
        } catch (error) {
            await markOtpSendStatus(otpId, 'failed', error?.message);
            /*
             * Tagged so it can be grepped out of a host's log stream, and the
             * message is repeated in otp_verifications.error_message so the
             * cause is recoverable from SQL when the logs are not reachable.
             */
            console.error("[send-otp] whatsapp send failed:", error?.message, error);
            return resp.status(500).json({
                success : false,
                rawLeadId : rawLeadId,
                message : "Something went wrong while sending OTP"
            });
        }

        await markOtpSendStatus(otpId, 'sent', null);
        return resp.status(200).json({
            success : true,
            rawLeadId : rawLeadId,
            retryAfter: 90,
            message : "Otp sent successfully on you WhatApp"
        })
        
    } catch (error) {
        console.error("send otp error:  " , error)
        return resp.status(500).json({
            success : false,
            rawLeadId : null,
            message : "Something went wrong"
        })
    }
}


const insertOtp = async(otp, phone_number, rawLeadId) => {
    const otpHash = crypto.createHash("sha256").update(otp).digest('hex');
    /*
     * Written BEFORE the provider is called so that a failed send still
     * counts against the rate limit. Previously the row was only inserted
     * on success, which left the endpoint completely unthrottled for as
     * long as the provider was erroring.
     */
    const sql = `INSERT INTO otp_verifications
                    (lead_id, phone, otp_hash, expires_at, attempts, status, last_sent_at, created_at)
                 VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), 0, 'pending', NOW(), NOW())`;
    const [result] = await db.query(sql, [rawLeadId, phone_number, otpHash]);
    return result.insertId;
}

const markOtpSendStatus = async(otpId, status, errorMessage) => {
    try {
        const sql = "UPDATE otp_verifications SET status = ?, error_message = ? WHERE id = ?";
        await db.query(sql, [status, errorMessage ? String(errorMessage).slice(0, 255) : null, otpId]);
    } catch (error) {
        // Never let bookkeeping failure mask the actual send result
        console.error("markOtpSendStatus error:", error);
    }
}

const getOtpByRawLeadId = async(leadId) => {
    /*
     * Rows whose provider call failed are skipped: the user never received
     * that code, so it must not shadow an earlier one that did arrive.
     * Expiry is computed by MySQL so all time math stays on one clock.
     */
    const sql = `SELECT *, (expires_at <= NOW()) AS is_expired
                 FROM otp_verifications
                 WHERE lead_id = ? AND status <> 'failed'
                 ORDER BY id DESC LIMIT 1`;
    const [rows] = await db.query(sql, [leadId]);
    return rows[0] || null;
}

const verifyOtp = async (otp, rawLeadId, connection) => {
    try {
        if (!rawLeadId || !otp) {
            return {
                success: false,
                status: 'missing',
                httpStatus: 400,
                message: "OTP is required"
            };
        }

        // Get latest OTP for this lead
        const otpRecord = await getOtpByRawLeadId(rawLeadId);

        // OTP record not found
        if (!otpRecord) {
            return {
                success: false,
                status: 'not_found',
                httpStatus: 404,
                message: "Please generate new OTP..."
            };
        }

        // OTP already used
        if (Number(otpRecord.is_verified) === 1) {
            return {
                success: false,
                status: 'already_used',
                httpStatus: 400,
                message: "OTP has already been used. Please request a new OTP."
            };
        }

        /*
         * Expiry is evaluated by MySQL (see getOtpByRawLeadId) instead of
         * comparing a DB timestamp against the Node clock. On shared hosting
         * the two can sit in different timezones, which silently shifts the
         * expiry window by hours.
         */
        if (Number(otpRecord.is_expired) === 1) {
            return {
                success: false,
                status: 'expired',
                httpStatus: 410,
                message: "OTP has expired. Please request a new OTP."
            };
        }

        // Maximum attempts already reached
        if (otpRecord.attempts >= 5) {
            return {
                success: false,
                status: 'blocked',
                httpStatus: 429,
                message: "Too many incorrect attempts. Please request a new OTP."
            };
        }

        // Hash entered OTP
        const otpHash = crypto
            .createHash("sha256")
            .update(String(otp))
            .digest("hex");

        // =====================================================
        // INVALID OTP
        // =====================================================
        if (otpHash !== otpRecord.otp_hash) {

            /*
             * IMPORTANT:
             *
             * attempts < 5 is checked inside the UPDATE itself.
             * This makes the increment atomic and prevents
             * concurrent requests from bypassing the 5-attempt limit.
             *
             * This runs on the pool and NOT on the caller's transaction
             * connection: a wrong OTP must stay counted even though the
             * caller rolls its transaction back on failure.
             */
            const [result] = await db.query(
                `UPDATE otp_verifications
                 SET attempts = attempts + 1
                 WHERE id = ?
                   AND is_verified = 0
                   AND attempts < 5`,
                [otpRecord.id]
            );

            /*
             * If affectedRows = 0, another request may have already
             * reached the maximum attempts.
             */
            if (result.affectedRows === 0) {
                return {
                    success: false,
                    status: 'blocked',
                    httpStatus: 429,
                    message: "Too many incorrect attempts. Please request a new OTP."
                };
            }

            /*
             * We already know the old attempts value.
             * Since this request successfully incremented it,
             * the new value is old value + 1.
             */
            const newAttempts = otpRecord.attempts + 1;

            // Block immediately on 5th failed attempt
            if (newAttempts >= 5) {
                return {
                    success: false,
                    status: 'blocked',
                    httpStatus: 429,
                    message: "Too many incorrect attempts. Please request a new OTP."
                };
            }

            return {
                success: false,
                status: 'invalid',
                httpStatus: 400,
                message: "Please enter valid OTP"
            };
        }

        // =====================================================
        // CORRECT OTP
        // =====================================================

        /*
         * Make verification atomic.
         *
         * If two requests submit the same correct OTP at almost
         * exactly the same time, only ONE request can change
         * is_verified from 0 to 1.
         *
         * This runs on the caller's transaction connection when one is
         * passed, so the OTP is only really consumed if the lead insert
         * that follows commits. Otherwise a rejected form would burn the
         * OTP and force the user to spend another send.
         */
        const runner = connection || db;
        const [result] = await runner.query(
            `UPDATE otp_verifications
             SET is_verified = 1,
                 verified_at = NOW()
             WHERE id = ?
               AND is_verified = 0
               AND expires_at > NOW()
               AND attempts < 5`,
            [otpRecord.id]
        );

        /*
         * If no row was updated, another request already used
         * the OTP or it became invalid/expired.
         */
        if (result.affectedRows === 0) {
            return {
                success: false,
                status: 'already_used',
                httpStatus: 400,
                message: "OTP has already been used. Please request a new OTP."
            };
        }

        return {
            success: true,
            message: "OTP verified"
        };

    } catch (error) {
        console.error("verifyOtp error:", error);

        return {
            success: false,
            status: 'error',
            httpStatus: 500,
            message: "Something went wrong"
        };
    }
};




module.exports = {
    saveLead, getAllLeads, getAllCities, getAllProducts, savePhoneNumber, downloadExcelReport, contactUs, sendOtp
}