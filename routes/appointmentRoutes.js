const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. Crear franja: POST a https://onrender.com (Protegido)
router.post('/create-slot', authMiddleware, appointmentController.createSlot);

// 2. Traer lista: GET a https://onrender.com (Público/Libre)
router.get('/list', appointmentController.listAppointments);

// 3. Reservar turno: POST a https://onrender.com (Protegido)
router.post('/book', authMiddleware, appointmentController.bookAppointment);

// 4. Cancelar o liberar: POST a https://onrender.com (Protegido)
router.post('/cancel', authMiddleware, appointmentController.cancelAppointment);

module.exports = router;
