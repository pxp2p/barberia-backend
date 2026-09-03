const express = require('express');
const router = express.Router(); // Corregido el tipado genérico
const authController = require('../controllers/authController');
const authMiddleware = require('../../middleware/authMiddleware'); // <-- ¡LE AGREGAMOS UN PUNTO MÁS PARA SALIR DE LA CARPETA ROUTES!

// Caminos públicos expuestos a internet para el login y el register
router.post('/register', authController.register);
router.post('/login', authController.login);

// Camino protegido por token para enlazar las notificaciones de los celulares
router.post('/save-subscription', authMiddleware, authController.saveSubscription);

module.exports = router;
