const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  date: {
    type: String, // Guarda la fecha en formato limpio (Ej: 2026-08-31)
    required: true
  },
  time: {
    type: String, // Guarda el horario (Ej: 14:30)
    required: true
  },
  status: {
    type: String,
    enum: ['disponible', 'ocupado'],
    default: 'disponible'
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Enlace inteligente con el ID real del Barbero de la tabla User
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Enlace inteligente con el ID real del Cliente de la tabla User
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
