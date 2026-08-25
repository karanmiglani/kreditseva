/*
 * Every one of these comes from the host's environment, NOT from a committed
 * file — `.env` is gitignored, so a working localhost says nothing about the
 * server. Missing vars used to surface as `fetch(undefined)`, i.e. a generic
 * "Failed to parse URL from undefined", which reads like a network fault
 * rather than a configuration one.
 */
const REQUIRED_WHATSAPP_VARS = [
    'WHATSAPP_API_URL',
    'WHATSAPP_API_KEY',
    'WHATSAPP_USER_ID',
    'WHATSAPP_TEMPLATE_ID',
    'WHATSAPP_NUMBER_ID',
    'WHATSAPP_NUMBER'
];

function assertWhatsappConfig() {
    const missing = REQUIRED_WHATSAPP_VARS.filter((key) => !String(process.env[key] || '').trim());
    if (missing.length > 0) {
        throw new Error(`WhatsApp is not configured on this server. Missing env: ${missing.join(', ')}`);
    }
}

async function sendWhatsappOtp(phoneNumber, otp) {
    assertWhatsappConfig();

    // Read at call time, not import time, so the check above and the values
    // used below can never disagree.
    const apiUrl = process.env.WHATSAPP_API_URL.trim();
    const apiKey = process.env.WHATSAPP_API_KEY.trim();

    const payload = {
        user_id: Number(process.env.WHATSAPP_USER_ID),
        template_id: Number(process.env.WHATSAPP_TEMPLATE_ID),
        campaign_type: 3,
        phone_number: `+91${phoneNumber}`,
        whatsapp_number_id: process.env.WHATSAPP_NUMBER_ID,
        whatsapp_number: process.env.WHATSAPP_NUMBER,
        is_shorten_url: false,
        contact_temp_var_map: [{ "{{1}}": "" }],
        media_files: false,
        use_dynamic_media: false,
        use_same_media_for_all: false,
        use_different_media_for_all: false,
        media_file: ",",
        copy_code_values: String(otp)

    }


    let resp;
    try {
        // Without this a hung provider holds the request open indefinitely
        resp = await fetch(apiUrl, {
            method: "POST",
            headers: {
                apiKey: apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000)
        });
    } catch (error) {
        /*
         * A bare fetch rejection ("fetch failed") hides whether outbound
         * traffic was blocked, DNS failed, or the provider timed out — all of
         * which happen on the server and never on a laptop. cause carries it.
         */
        const reason = error?.name === 'TimeoutError'
            ? 'timed out after 15s'
            : (error?.cause?.code || error?.cause?.message || error?.message);
        throw new Error(`Could not reach WhatsApp provider (${apiUrl}): ${reason}`);
    }

    /*
     * Read as text first. A proxy or WAF in front of the provider answers with
     * an HTML error page, and resp.json() on that throws a JSON syntax error
     * that says nothing about the real HTTP status.
     */
    const bodyText = await resp.text();
    let data;
    try {
        data = JSON.parse(bodyText);
    } catch {
        throw new Error(`WhatsApp provider returned non-JSON (HTTP ${resp.status}): ${bodyText.slice(0, 200)}`);
    }

    if (!resp.ok) {
        throw new Error(data.message || `Error in generating OTP (HTTP ${resp.status})`);
    }

    if (data.success !== true) {
        throw new Error(data?.message || "Whatsapp message not sent");
    }

    return {
        success: true,
        messageId: data?.data?.message_id || null,
        response: data
    }
}

module.exports = {
    sendWhatsappOtp,
    assertWhatsappConfig,
    REQUIRED_WHATSAPP_VARS
}
