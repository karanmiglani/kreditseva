const jwt = require('jsonwebtoken');

function authMiddleware(req, resp, next){
    try{
        const token = req.cookies?.token;
        if(!token){
            return resp.status(401).json({
                success : false,
                message : 'User Unauthorized!'
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.admin = decoded;
        next();
    }catch(err){
        console.log(err);
        return resp.status(401).json({
            success : false,
            message : 'Invalid token!'
        })
    }
}


module.exports = authMiddleware;