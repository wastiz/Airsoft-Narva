const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// ... существующие маршруты ...

// Маршрут для создания игрока
router.post('/create-player', adminController.createPlayer);

module.exports = router; 