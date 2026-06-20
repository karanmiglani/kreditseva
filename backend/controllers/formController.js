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
        const sql = `INSERT INTO  credit_applications(application_id,phone_number) values(?,?)`;
        const appId = crypto.randomUUID();
        const [result] = await db.query(sql,[appId, phoneNumber ]);
        if(result.insertId){
            return resp.status(200).json({
                success : true,
                appId : appId
            })
        }
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

async function creditCardLead(req,resp){
    const {appId, name, occupation} = req.body;
    if(!appId || !name || !occupation){
        return req.status(400).json({
            success : false,
            messgage : 'Please enter all details'
        })
    }
    console.log(appId);
}

module.exports = { savePhone, creditCardLead}