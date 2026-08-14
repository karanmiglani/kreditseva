const express = require('express');
const { savePhoneNumber, contactUs, sendOtp } = require('../controllers/loanApplicationController');
const { route } = require('./pageRoutes');
const router = express.Router();

router.post('/save-phone-number', savePhoneNumber)
router.post('/contact-form', contactUs)
router.post('/send-otp', sendOtp)



module.exports = router;