const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  date: {
    type: String, 
    required: true
  },
  time: {
    type: String, 
    required: true
  },
  status: {
    type: String,
    enum: ['disponible', 'ocupado'],
    default: 'disponible'
  },
  barber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Conexión estricta con la tabla de usuarios de MongoDB Atlas
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Conexión estricta con la tabla de usuarios de MongoDB Atlas para el populate
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
