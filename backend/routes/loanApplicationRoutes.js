const express = require('express');
const { savePhoneNumber } = require('../controllers/loanApplicationController');
const authMiddleware = require('../midllewares/authMiddleware');
const { savePhone, creditCardLead } = require('../controllers/formController');
const router = express.Router();

router.post('/save-phone-number', savePhoneNumber)
router.post('/save-form-phone', savePhone);
router.post('/save-credit-card-lead', creditCardLead);


module.exports = router;