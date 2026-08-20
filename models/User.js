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
        unique: true, // No permite dos cuentas con el mismo celular
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['client', 'barber'],
        default: 'client'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
