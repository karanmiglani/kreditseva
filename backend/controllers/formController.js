const db = require('../config/db');
const crypto = require('crypto');


async function savePhone(req, resp){
    try {
            const {phoneNumber} = req.body;
    if(!phoneNumber || ! /^[6-9]{1}[0-9]{9}$/.test(phoneNumber)){
        return resp.status(400).json({
            success : false,
        });
    }
    const appId = checkPhoneExistOrNot(phoneNumber);    
        return resp.status(200).json({
            success : true,
            appId : appId
        })
        return resp.status(400).json({
            success : false
        })
    } catch (error) {
        console.log(error);
        return resp.status(500).json({
            success : false
        })
    }
}


const checkPhoneExistOrNot = async(phoneNumber) => {
    const sql = "SELECT application_id FROM credit_application WHERE phone_number = ? AND created_at >= NOW() - INTERVAL 30 DAY AND is_completed = 0";
    const [result] = await db.query(sql,[phoneNumber]);
    if(!result.length){
         const sql = `INSERT INTO  credit_applications(application_id,phone_number) values(?,?)`;
         const appId = crypto.randomUUID();
         const [result] = await db.query(sql,[appId, phoneNumber]);
         return appId;
    }
    return result[0].application_id;
}

async function creditCardLead(req,resp){
try {
        const {appId, name, occupation} = req.body;
    if(!appId || !name || !occupation){
        return req.status(400).json({
            success : false,
            messgage : 'Please enter all details'
        })
    }
    const resp = checkAndSaveLead(appId);
} catch (error) {
    console.log(error);
    return resp.status(500).json({
        success : false,
        messgage : 'Server error, Please try again.'
    })
}
}

const checkAndSaveLead = async (appId) => {
    const getLeadSql = "SELECT appID from" 
}

module.exports = { savePhone, creditCardLead}