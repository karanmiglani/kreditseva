const express = require('express');
const authMiddleware = require('../midllewares/authMiddleware');
const { getStats } = require('../controllers/dashboardController');
const router = express.Router();


router.get('/get-stats', authMiddleware,getStats)

module.exports = router;