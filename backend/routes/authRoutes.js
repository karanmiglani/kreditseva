const express =  require('express');
const router = express.Router();
const { login } = require('../controllers/loginController');
const authMiddleware = require('../midllewares/authMiddleware');


router.post('/login', login);
router.get('/check-auth', authMiddleware, (req,resp) => {
    return resp.json({
        success : true,
        admin : req.admin
    })
})



module.exports = router;