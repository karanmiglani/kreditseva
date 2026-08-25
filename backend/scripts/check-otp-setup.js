/*
 * Run this ON THE SERVER when OTP works locally but not in production:
 *
 *   node scripts/check-otp-setup.js                 # config + DB checks only
 *   node scripts/check-otp-setup.js 9876543210      # also does one real send
 *
 * It prints to stdout, so it works even where the app's own log stream is not
 * reachable. No secret values are printed — only whether each one is set.
 */
require('../config/env');
const db = require('../config/db');
const { sendWhatsappOtp, REQUIRED_WHATSAPP_VARS } = require('../services/whatsAppService');

const phone = process.argv[2];

async function main() {
    let failures = 0;

    console.log('\n1. Environment');
    console.log(`   NODE_ENV = ${process.env.NODE_ENV || '(unset)'}`);
    console.log(`   node     = ${process.version}`);
    for (const key of REQUIRED_WHATSAPP_VARS) {
        const value = String(process.env[key] || '').trim();
        // The URL is safe to print in full and is the var most often wrong.
        const shown = key === 'WHATSAPP_API_URL' ? value : `set (${value.length} chars)`;
        console.log(`   ${value ? 'OK  ' : 'MISS'} ${key}${value ? ` = ${shown}` : ''}`);
        if (!value) failures++;
    }

    console.log('\n2. Database');
    try {
        const [rows] = await db.query("SHOW TABLES LIKE 'otp_verifications'");
        if (rows.length === 0) {
            console.log('   MISS otp_verifications table does not exist — run backend/sql/otp_verifications.sql');
            failures++;
        } else {
            const [[counts]] = await db.query(
                `SELECT COUNT(*) AS total,
                        SUM(status = 'failed')  AS failed,
                        SUM(status = 'sent')    AS sent,
                        SUM(status = 'pending') AS pending
                 FROM otp_verifications`
            );
            console.log(`   OK   otp_verifications exists — ${counts.total} rows (sent ${counts.sent || 0}, failed ${counts.failed || 0}, pending ${counts.pending || 0})`);

            const [recent] = await db.query(
                `SELECT id, phone, status, error_message, created_at
                 FROM otp_verifications ORDER BY id DESC LIMIT 5`
            );
            if (recent.length > 0) {
                console.log('   Last 5 attempts:');
                recent.forEach((r) => {
                    console.log(`     #${r.id} ${r.created_at} ${r.phone} ${r.status}${r.error_message ? ` — ${r.error_message}` : ''}`);
                });
            }
        }
    } catch (error) {
        // mysql2 connection errors often carry an empty message but a useful code
        console.log(`   FAIL database check: ${error.code || ''} ${error.message || error}`.trim());
        failures++;
    }

    console.log('\n3. Provider');
    if (!phone) {
        console.log('   SKIP no phone number given — pass one to attempt a real send');
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
        console.log(`   FAIL "${phone}" is not a 10-digit Indian mobile number`);
        failures++;
    } else {
        try {
            const result = await sendWhatsappOtp(phone, '123456');
            console.log(`   OK   provider accepted the message (id ${result.messageId || 'n/a'})`);
        } catch (error) {
            console.log(`   FAIL ${error.message}`);
            failures++;
        }
    }

    console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} check(s) failed.\n`);
    await db.end();
    process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error('check-otp-setup crashed:', error);
    process.exit(1);
});
