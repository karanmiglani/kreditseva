const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isProd } = require('../config/env');


const login = async (req, resp) => {
    try{
        const { email, password } = req.body;
        const [admins] = await db.query(
            'SELECT id, name, email, role, password FROM admins WHERE email = ?',
            [email]
        );
        if(admins.length === 0){
            return resp.status(401).json({
                success : false,
                message : 'Invalid emai!'
            });
        }
        const admin = admins[0];

        const isMatch = await bcrypt.compare(password, admin.password);
        if(!isMatch){
            return resp.status(400).json({
                success : false,
                message : 'Invalid Password!'
            });
        }
        const token = jwt.sign(
            {
                id : admin.id,
                name : admin.name,
                role : admin.role
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn : '7d'
            }
        )
        resp.cookie('token', token, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return resp.status(200).json({
            success : true,
            message : 'Login Successfull!',
            admin : {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    }catch(err){
        console.error(err);
        return resp.status(500).json({
            success : false,
            message : 'Server error, Please try again...'
        })
    }
}



module.exports = {
    login
}