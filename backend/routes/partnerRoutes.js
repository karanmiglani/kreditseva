const express = require('express');
const { savePartner, getAllPartners } = require('../controllers/partnerController');
const authMiddleware = require('../midllewares/authMiddleware');
const router = express.Router();

router.post('/register', savePartner);
router.get('/all', authMiddleware, getAllPartners);

module.exports = router;
