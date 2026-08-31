const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para registrar usuarios nuevos: POST a https://onrender.com
router.post('/register', authController.register);

// Ruta para el login real: POST a https://onrender.com
router.post('/login', authController.login);

module.exports = router;
