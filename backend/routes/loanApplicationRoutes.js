const express = require('express');
const { savePhoneNumber, contactUs } = require('../controllers/loanApplicationController');
const router = express.Router();

router.post('/save-phone-number', savePhoneNumber)
router.post('/contact-form', contactUs)


module.exports = router;