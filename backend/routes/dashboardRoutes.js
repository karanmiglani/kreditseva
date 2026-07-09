const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { requireRole } = authMiddleware;
const { getStats } = require('../controllers/dashboardController');
const { getAllLeads, getAllCities, getAllProducts } = require('../controllers/loanApplicationController');
const { getAllContactMessages, downloadContactExcel } = require('../controllers/contactController');
const { getAllPartners, downloadPartnerExcel } = require('../controllers/partnerController');
const router = express.Router();

const adminOnly = [authMiddleware, requireRole('admin')];

router.get('/get-stats', ...adminOnly, getStats)
router.get('/all-leads', ...adminOnly, getAllLeads)
router.get('/all-cities', ...adminOnly, getAllCities)
router.get('/all-products', ...adminOnly, getAllProducts)
router.get('/contact-messages', ...adminOnly, getAllContactMessages)
router.get('/contact-messages/download', ...adminOnly, downloadContactExcel)
router.get('/partner-leads', ...adminOnly, getAllPartners)
router.get('/partner-leads/download', ...adminOnly, downloadPartnerExcel)

module.exports = router;