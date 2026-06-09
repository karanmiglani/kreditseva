const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { getStats } = require('../controllers/dashboardController');
const { getAllLeads } = require('../controllers/loanApplicationController');
const router = express.Router();


router.get('/get-stats', authMiddleware,getStats)
router.get('/all-leads', authMiddleware, getAllLeads)

module.exports = router;