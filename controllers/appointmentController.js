const Appointment = require('../models/Appointment');
const User = require('../models/User');
const webpush = require('web-push');

// CONFIGURACIÓN DE LLAVES VAPID (Sintaxis nativa corregida con Vapid minúsculo)
webpush.setVapidDetails(
  'mailto:jefaturabarberia@gmail.com',
  'BDoG5Z_etfLKXw_De1Vg34jpspn-Ft75YAzCn5HIdhRA_fZBQeLPkHhOLNMTt0t4PVnJpy_H7zFyFsS0q7dhEdU', // Llave Pública de Firma
  'dqAlNnb4AdhA48HWnahXvEA0yLBPkk2zDJYkcx39FB0' // Llave Privada de Firma
);

// 1. PUBLICAR UNA FRANJA HORARIA NUEVA (BARBEROS)
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

// 3. RESERVAR EL TURNO (MANDA ALERTA QUIRÚRGICA EXCLUSIVA AL BARBERO MAESTRO)
exports.bookAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    if (req.user.role === 'client') {
      const hasActiveBooking = await Appointment.findOne({ client: req.user.id, status: 'ocupado' });
      if (hasActiveBooking) {
        return res.status(400).json({ 
          message: `Ya tenés un turno reservado para el día ${hasActiveBooking.date.split('-').reverse().join('/')} a las ${hasActiveBooking.time} hs. Cancelá el anterior para elegir uno nuevo.` 
        });
      }
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status === 'ocupado') {
      return res.status(400).json({ message: 'El turno ya no está disponible' });
    }

    appointment.status = 'ocupado';
    appointment.client = req.user.id; 
    await appointment.save();

    // 📲 DISPARADOR PUSH 1: NOTIFICAR AL BARBERO (El dueño 1111111111)
    const barberUser = await User.findOne({ role: 'barber', pushSubscription: { $ne: null } });
    
    if (barberUser) {
      const payload = JSON.stringify({
        title: '¡NUEVO TURNO AGENDADO!',
        body: `${req.user.name} reservó el turno de las ${appointment.time} hs del día ${appointment.date.split('-').reverse().join('/')}.`,
        icon: '/logo.png'
      });

      webpush.sendNotification(barberUser.pushSubscription, payload)
        .catch(err => console.error('Error enviando push al barbero:', err));
    }

    return res.status(200).json({ message: 'Turno reservado con éxito', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al reservar el turno', error: error.message });
  }
};

// 4. CANCELAR RESERVA O BORRAR FRANJA (CON CAPTURA DE TOKEN CRONOLÓGICA CORRECTA)
exports.cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Traemos el turno y populamos TODOS los datos del usuario cliente (incluido su token pushSubscription)
    const appointment = await Appointment.findById(appointmentId).populate('client');
    if (!appointment) {
      return res.status(404).json({ message: 'El turno solicitado no existe' });
    }

    // Caso A: Si el turno está libre y lo cancela el barbero, es una eliminación física de franja
    if (appointment.status === 'disponible' && req.user.role === 'barber') {
      await Appointment.findByIdAndDelete(appointmentId);
      return res.status(200).json({ message: 'Franja horaria eliminada del mapa correctamente' });
    }

    // 👑 REGLA DE ORO DE SEGURIDAD (LA SOLUCIÓN):
    // Guardamos una copia exacta y profunda del cliente y su token PUSH en una variable aislada 
    // ANTES de vaciar el casillero en la base de datos para que no se pierda.
    const savedClientToken = appointment.client?.pushSubscription || null;
    const appointmentTime = appointment.time;

    // Ahora sí, limpiamos los casilleros de forma segura en MongoDB Atlas
    appointment.status = 'disponible';
    appointment.client = null;
    await appointment.save();

    // 📲 DISPARADOR PUSH 2: NOTIFICAR AL CLIENTE (Usa la copia de seguridad que guardamos arriba)
    if (savedClientToken) {
      const payload = JSON.stringify({
        title: 'TURNO LIBERADO - JEFATURA',
        body: `La barbería ha liberado tu turno de las ${appointmentTime} hs. Ya podés ingresar y reservar otro horario en la grilla.`,
        icon: '/logo.png'
      });

      // El servidor despacha el globo neón directo al chip de ese celular específico
      webpush.sendNotification(savedClientToken, payload)
        .catch(err => console.error('Error enviando push de liberación al cliente:', err));
    }

    return res.status(200).json({ message: 'Horario liberado correctamente', appointment });

  } catch (error) {
    return res.status(500).json({ message: 'Error al procesar la cancelación', error: error.message });
  }
};

