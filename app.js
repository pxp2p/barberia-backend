require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
// Liberación absoluta de CORS para producción y pruebas locales sin bloqueos
// Liberación absoluta de CORS para producción en Vercel sin bloqueos de navegador
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');

    // Responder de inmediato a las peticiones pre-vuelo (OPTIONS) de Chrome
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
const cors = require('cors');
app.use(cors());



async function startServer() {
    try {
               console.log('⏳ Intentando conectar a MongoDB Atlas...');
        // Conexión fija directa a tu base de datos real de internet
        await mongoose.connect('mongodb+srv://joaco:joaquin123@cluster0.ibzonk9.mongodb.net/barberia?retryWrites=true&w=majority');
        console.log('🚀 CONEXIÓN REALIZADA CON ÉXITO A MONGODB ATLAS (NUBE)');

        // Forzamos la inyección del Barbero Jefe real en Atlas
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
            console.log('👑 JEFATURA GENÉRICA INYECTADA EN ATLAS CON ÉXITO.');
        }


        // Verificamos e Inyectamos la Jefatura Genérica Permanente
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
            console.log('👑 JEFATURA GENÉRICA INYECTADA EN LA NUBE CON ÉXITO.');
        }

        console.log('👑 SISTEMA DE PRODUCCIÓN BLINDADO: Usuario: 1111111111 | Clave: barber99');


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