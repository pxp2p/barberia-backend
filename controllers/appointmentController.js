const Appointment = require('../models/Appointment');

// 1. PUBLICAR UNA FRANJA HORARIA NUEVA (SOLO BARBEROS)
exports.createSlot = async (req, res) => {
  try {
    const { date, time } = req.body;

    // Evitar que se duplique un turno exactamente el mismo día a la misma hora
    const slotExists = await Appointment.findOne({ date, time });
    if (slotExists) {
      return res.status(400).json({ message: 'Este horario ya está publicado para ese día' });
    }

    const newAppointment = new Appointment({
      date,
      time,
      status: 'disponible',
      barber: req.user.id // Acoplado al token de seguridad del barbero logueado
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
    // Los trae ordenados por fecha y hora ascendente
    const appointments = await Appointment.find().sort({ date: 1, time: 1 });
    return res.status(200).json(appointments);
  } catch (error) {
    return res.status(500).json({ message: 'Error al traer la lista', error: error.message });
  }
};

// 3. RESERVAR UN TURNO DISPONIBLE (CLIENTES O BARBEROS)
exports.bookAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'El turno solicitado no existe' });
    }

    if (appointment.status === 'ocupado') {
      return res.status(400).json({ message: 'Este turno ya fue reservado por otra persona' });
    }

    appointment.status = 'ocupado';
    appointment.client = req.user.id; // Asignar el ID real del usuario que reserva
    await appointment.save();

    return res.status(200).json({ message: 'Turno reservado con éxito', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al reservar el turno', error: error.message });
  }
};

// 4. CANCELAR O LIBERAR UN TURNO AGENDA
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'El turno solicitado no existe' });
    }

    // Volver a dejarlo libre y limpiar el cliente asignado
    appointment.status = 'disponible';
    appointment.client = null;
    await appointment.save();

    return res.status(200).json({ message: 'Horario liberado correctamente', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al cancelar el turno', error: error.message });
  }
};
