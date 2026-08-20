require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); 
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
// Configuración dinámica de puertos obligatoria para Render
const PORT = process.env.PORT || 10000;

app.use(express.json());

// Liberación absoluta de CORS configurada de forma limpia para Vercel
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors());

async function startServer() {
    try {
        console.log('⏳ Intentando conectar a MongoDB Atlas...');
        // Clavamos la URI directa limpia de tu Atlas para que no falle por variables
        await mongoose.connect('mongodb+srv://barber:corte10gold@cluster0.ibzonk9.mongodb.net/barberia?retryWrites=true&w=majority');
        console.log('🚀 CONEXIÓN REALIZADA CON ÉXITO A MONGODB ATLAS (NUBE)');

        // Inyección automática del Barbero Jefe permanente en internet
        const barberExists = await User.findOne({ phone: '1111111111' });
        if (!barberExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('barber99', salt);
            
            const defaultBarber = new User({
                name: 'Barbería Jefatura',
                phone: '1111111111', 
                password: hashedPassword,
                role: 'barber'
            });
            await defaultBarber.save();
            console.log('👑 JEFATURA GENÉRICA INYECTADA CON ÉXITO.');
        }

        console.log('👑 SISTEMA OPERATIVO ONLINE: Usuario: 1111111111 | Clave: barber99');

        app.use('/api/auth', authRoutes);
        app.use('/api/appointments', appointmentRoutes);

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (err) {
        console.error('❌ ERROR REAL DE CONEXIÓN:', err.message);
    }
}

startServer();

