const express = require('express');
const { savePhoneNumber } = require('../controllers/loanApplicationController');
const authMiddleware = require('../midllewares/authMiddleware');
const router = express.Router();

router.post('/save-phone-number', savePhoneNumber)


module.exports = router;