const db = require('../config/db');


const saveLead = async  (req, resp) => {
    console.log(req.body);

    try {
        const {name, phone_number, city, net_monthly_salary, product, occupation, panCard, source} =  req.body;
        if(!name || !phone_number || !city || !net_monthly_salary || !product){
            return resp.status(400).json({
                success : false,
                message : 'Required fields are mandatory.'
            })
        }
        const sql = "INSERT INTO loan_applications(name, phone_number, city, net_monthly_salary, product, occupation, pancard, source) values (?,?,?,?,?,?,?,?)";
        const [result] = await db.query(sql,[name,phone_number,city,net_monthly_salary,product,occupation,panCard,source]);
        if(result.affectedRows === 0){
            return resp.status(400).json({
                success : false,
                message : 'Application Error, Please try again.'
            });
        }
        return resp.status(201).json({
                success : true,
                message : `Thanks for contacting KreditSeva for ${product}. Our team will call you shortly for further assictance `
        })

    } catch (error) {

        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again'
        })
    }

}

module .exports = {
    saveLead
}