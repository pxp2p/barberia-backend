const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true, // Evita que dos personas se registren con el mismo celular
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['barber', 'client'], // Solo permite estos dos roles
    default: 'client'
  },
  pushSubscription: {
    type: Object,
    default: null
  }
}, {
  timestamps: true // Guarda de forma automática la fecha de creación
});

module.exports = mongoose.model('User', UserSchema);
