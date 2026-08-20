const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    barber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null significa que la franja horaria está "Disponible"
    },
    date: {
        type: String, // Formato AAAA-MM-DD para búsquedas exactas sin desfasajes de zona horaria
        required: true
    },
    time: {
        type: String, // Formato HH:MM (ej: "09:30")
        required: true
    },
    status: {
        type: String,
        enum: ['disponible', 'pendiente', 'confirmado', 'cancelado'],
        default: 'disponible'
    }
}, {
    timestamps: true
});

// Evita que se duplique la misma franja horaria para el mismo barbero en el mismo día y hora
AppointmentSchema.index({ barber: 1, date: 1, time: 1 }, { unique: true });

// LA LÍNEA QUE FALTABA PARA EXPORTAR EL MODELO A EXPORTACIONES COMPATIBLES
module.exports = mongoose.model('Appointment', AppointmentSchema);
