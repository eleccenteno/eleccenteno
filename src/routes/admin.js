const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

router.get('/stats', adminController.getStats);

module.exports = router;
