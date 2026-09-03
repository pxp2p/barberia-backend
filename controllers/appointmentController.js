const Appointment = require('../models/Appointment');

// 1. PUBLICAR UNA FRANJA HORARIA NUEVA (SOLO BARBEROS)
exports.createSlot = async (req, res) => {
  try {
    const { date, time } = req.body;

    const slotExists = await Appointment.findOne({ date, time });
    if (slotExists) {
      return res.status(400).json({ message: 'Este horario ya está publicado para ese día' });
    }

    const newAppointment = new Appointment({
      date,
      time,
      status: 'disponible',
      barber: req.user.id 
    });

    await newAppointment.save();
    return res.status(201).json({ message: 'Franja horaria publicada con éxito', appointment: newAppointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al crear la franja', error: error.message });
  }
};

// 2. LISTAR ABSOLUTAMENTE TODOS LOS TURNOS ACTIVOS
exports.listAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('client', 'name phone')
      .sort({ date: 1, time: 1 });
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: 'Error al traer la lista', error: error.message });
  }
};

// 3. RESERVAR EL TURNO (CON ADUANA DE TURNO ÚNICO PARA CLIENTES)
exports.bookAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // 🔒 REGLA DE ORO DE SEGURIDAD INTERNA:
    // Si el usuario logueado es un cliente, verificamos si ya tiene algún turno ocupado en el sistema
    if (req.user.role === 'client') {
      const hasActiveBooking = await Appointment.findOne({ client: req.user.id, status: 'ocupado' });
      
      if (hasActiveBooking) {
        return res.status(400).json({ 
          message: `Ya tenés un turno reservado para el día ${hasActiveBooking.date.split('-').reverse().join('/')} a las ${hasActiveBooking.time} hs. Cancelá el anterior para poder elegir uno nuevo.` 
        });
      }
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'El turno solicitado no existe' });
    }

    if (appointment.status === 'ocupado') {
      return res.status(400).json({ message: 'Este turno ya fue reservado por otra persona' });
    }

    appointment.status = 'ocupado';
    appointment.client = req.user.id; 
    await appointment.save();

    return res.status(200).json({ message: 'Turno reservado con éxito', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al reservar el turno', error: error.message });
  }
};

// 4. CANCELAR O LIBERAR UN TURNO AGENDADO
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'El turno solicitado no existe' });
    }

    appointment.status = 'disponible';
    appointment.client = null;
    await appointment.save();

    return res.status(200).json({ message: 'Horario liberado correctamente', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al cancelar el turno', error: error.message });
  }
};
