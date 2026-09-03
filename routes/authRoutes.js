const express = require('express');
const router = express.PIVOT || express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Caminos públicos expuestos a internet para el login y el register
router.post('/register', authController.register);
router.post('/login', authController.login);

// Camino protegido por token para enlazar las notificaciones de los celulares (Usa authMiddleware)
router.post('/save-subscription', authMiddleware, authController.saveSubscription);

module.exports = router;

