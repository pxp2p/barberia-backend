const Appointment = require('../models/Appointment');

// 1. El Barbero crea una franja horaria disponible desde la pantalla
exports.createTimeSlot = async (req, res) => {
    try {
        const { date, time } = req.body;
        const barberId = req.user.id;

        const newSlot = new Appointment({
            barber: barberId,
            date,
            time,
            status: 'disponible'
        });

        await newSlot.save();
        res.status(201).json({ message: 'Franja horaria creada con éxito', slot: newSlot });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Esa franja horaria ya existe para este barbero' });
        }
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

// 2. El Cliente reserva un turno disponible (Con límite estricto de 1 turno activo por persona)
exports.bookAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const clientId = req.user.id;

        // Regla de Negocio: Verificar si el cliente ya tiene un turno activo confirmado
        const existingAppointment = await Appointment.findOne({ client: clientId, status: 'confirmado' });
        if (existingAppointment) {
            return res.status(400).json({ 
                message: 'Ya tenés un turno reservado. Llamá al barbero para cancelarlo si querés reservar otro.' 
            });
        }

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Turno no encontrado' });
        }

        if (appointment.status !== 'disponible') {
            return res.status(400).json({ message: 'Este turno ya no está disponible' });
        }

        appointment.client = clientId;
        appointment.status = 'confirmated'; // Corregido para machear el estado de tu renderizado
        appointment.status = 'confirmado'; 
        await appointment.save();

        res.status(200).json({ message: 'Turno reservado con éxito', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

// 3. Obtener turnos con filtro dinámico futuro (Para barberos por fecha, para clientes todo lo que viene)
// 3. Obtener turnos con filtro dinámico futuro y purga automática de estados viejos
exports.getAppointmentsByDate = async (req, res) => {
    try {
        const { date } = req.query;

        // Calculamos fecha y hora actual local de Argentina
        const now = new Date();
        const tzoffset = now.getTimezoneOffset() * 60000;
        const localTimeStr = new Date(now.getTime() - tzoffset).toISOString();
        const currentDate = localTimeStr.split('T')[0]; // "2026-08-03"
        const currentTime = localTimeStr.split('T')[1].substring(0, 5); // "22:56"

        // AUTO-PURGER SENIOR: Buscamos turnos pasados que sigan confirmados y los desactivamos de la base de datos
        // Condición A: Días anteriores enteros
        // Condición B: Hoy pero con horas menores a la actual
        await Appointment.updateMany(
            {
                status: 'confirmado',
                $or: [
                    { date: { $lt: currentDate } },
                    { date: currentDate, time: { $lt: currentTime } }
                ]
            },
            {
                $set: { status: 'cancelado', client: null } // Libera el ID del cliente al instante para que pueda volver a sacar turno
            }
        );

        let query = {};

        if (date) {
            // Filtro del Barbero (por día específico)
            query.date = date;
            if (date === currentDate) {
                query.time = { $gte: currentTime };
            }
        } else {
            // Filtro del Cliente (todo el cronograma futuro continuo)
            query.$or = [
                { date: { $gt: currentDate } },
                { date: currentDate, time: { $gte: currentTime } }
            ];
        }

        const appointments = await Appointment.find(query)
            .populate('client', 'name email phone')
            .sort({ date: 1, time: 1 });
            
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};



// 4. El Barbero cancela y libera el turno a mano
exports.cancelAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Turno no encontrado' });
        }

        // Devolvemos el turno a su estado inicial limpio
        appointment.client = null;
        appointment.status = 'disponible';
        await appointment.save();

        res.status(200).json({ message: 'Turno liberado con éxito', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

