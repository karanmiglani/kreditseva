const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { getStats } = require('../controllers/dashboardController');
const { getAllLeads, getAllCities, getAllProducts } = require('../controllers/loanApplicationController');
const { getAllContactMessages, downloadContactExcel } = require('../controllers/contactController');
const { getAllPartners, downloadPartnerExcel } = require('../controllers/partnerController');
const router = express.Router();


router.get('/get-stats', authMiddleware, getStats)
router.get('/all-leads', authMiddleware, getAllLeads)
router.get('/all-cities', authMiddleware, getAllCities)
router.get('/all-products', authMiddleware, getAllProducts)
router.get('/contact-messages', authMiddleware, getAllContactMessages)
router.get('/contact-messages/download', authMiddleware, downloadContactExcel)
router.get('/partner-leads', authMiddleware, getAllPartners)
router.get('/partner-leads/download', authMiddleware, downloadPartnerExcel)

module.exports = router;