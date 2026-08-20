const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Crear franja horaria (Solo permitido para Barberos)
router.post('/create-slot', protect, authorize('barber'), appointmentController.createTimeSlot);

// Reservar un turno (Permitido para Clientes)
router.post('/book', protect, appointmentController.bookAppointment);

// Ver turnos por fecha (Público)
router.get('/list', appointmentController.getAppointmentsByDate);

module.exports = router;
// Liberar turno (Solo permitido para Barberos)
router.post('/cancel', protect, authorize('barber'), appointmentController.cancelAppointment);
