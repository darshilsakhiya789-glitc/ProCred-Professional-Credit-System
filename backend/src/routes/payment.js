const express = require('express');
const router = express.Router();
const { subscribe } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/subscribe', protect, subscribe);

module.exports = router;
