const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL;
const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY;

async function sendWhatsappOtp(phoneNumber, otp) {
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


    const resp = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
            apiKey: WHATSAPP_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
        throw new Error(data.message || "Error in generating OTP");
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
    sendWhatsappOtp
}

