const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { getStats } = require('../controllers/dashboardController');
const { getAllLeads, getAllCities, getAllProducts } = require('../controllers/loanApplicationController');
const router = express.Router();


router.get('/get-stats', authMiddleware,getStats)
router.get('/all-leads', authMiddleware, getAllLeads)
router.get('/all-cities', authMiddleware, getAllCities)
router.get('/all-products', authMiddleware, getAllProducts)

module.exports = router;