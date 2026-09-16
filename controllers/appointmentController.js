const Appointment = require('../models/Appointment');
const User = require('../models/User');
const webpush = require('web-push');

// =========================================================
// CONFIGURACIÓN DE LLAVES VAPID
// =========================================================

webpush.setVapidDetails(
  'mailto:jefaturabarberia@gmail.com',
  'BDoG5Z_etfLKXw_De1Vg34jpspn-Ft75YAzCn5HIdhRA_fZBQeLPkHhOLNMTt0t4PVnJpy_H7zFyFsS0q7dhEdU',
  'dqAlNnb4AdhA48HWnahXvEA0yLBPkk2zDJYkcx39FB0'
);


// =========================================================
// FUNCIÓN AUXILIAR
// OBTENER FECHA/HORA ACTUAL DE ARGENTINA
// =========================================================

const getArgentinaDateTime = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
};


// =========================================================
// 1. PUBLICAR UNA FRANJA HORARIA NUEVA
// SOLO BARBEROS
// =========================================================

exports.createSlot = async (req, res) => {
  try {

    // Seguridad adicional
    if (!req.user || req.user.role !== 'barber') {
      return res.status(403).json({
        message: 'Solo un barbero puede publicar horarios',
      });
    }

    const { date, time } = req.body;


    // Validación básica
    if (!date || !time) {
      return res.status(400).json({
        message: 'La fecha y el horario son obligatorios',
      });
    }


    // Evitar horarios duplicados
    const slotExists = await Appointment.findOne({
      date,
      time,
    });

    if (slotExists) {
      return res.status(400).json({
        message:
          'Este horario ya está publicado para ese día',
      });
    }


    // Crear turno
    const newAppointment = new Appointment({
      date,
      time,
      status: 'disponible',
      barber: req.user.id,
    });

    await newAppointment.save();


    return res.status(201).json({
      message: 'Franja horaria publicada con éxito',
      appointment: newAppointment,
    });

  } catch (error) {

    console.error(
      'Error al crear la franja:',
      error
    );

    return res.status(500).json({
      message: 'Error al crear la franja',
      error: error.message,
    });
  }
};


// =========================================================
// 2. LISTAR TODOS LOS TURNOS
// Y LIBERAR AUTOMÁTICAMENTE LOS VENCIDOS
// =========================================================

exports.listAppointments = async (req, res) => {
  try {

    /*
      Obtenemos la fecha/hora actual de Argentina
      en formato:

      YYYY-MM-DDTHH:mm
    */

    const nowArgentina = getArgentinaDateTime();


    /*
      Buscamos solamente los turnos ocupados.
    */

    const occupiedSlots = await Appointment.find({
      status: 'ocupado',
    });


    /*
      Revisamos si alguno ya venció.
    */

    for (const slot of occupiedSlots) {

      if (!slot.date || !slot.time) {
        continue;
      }


      /*
        Formato:

        YYYY-MM-DDTHH:mm
      */

      const slotDateTime =
        `${slot.date}T${slot.time}`;


      /*
        Si el turno ya pasó:

        - vuelve a disponible
        - elimina el cliente
      */

      if (nowArgentina > slotDateTime) {

        slot.status = 'disponible';
        slot.client = null;

        await slot.save();
      }
    }


    /*
      Traemos nuevamente todos los turnos,
      ya con la información actualizada.
    */

    const appointments = await Appointment.find()
      .populate(
        'client',
        'name phone pushSubscription'
      )
      .sort({
        date: 1,
        time: 1,
      });


    return res.status(200).json(
      appointments
    );

  } catch (error) {

    console.error(
      'Error al traer la lista:',
      error
    );

    return res.status(500).json({
      message:
        'Error al traer la lista y limpiar turnos',
      error: error.message,
    });
  }
};


// =========================================================
// 3. CANCELAR RESERVA / LIBERAR TURNO
// O ELIMINAR FRANJA DISPONIBLE
// =========================================================

exports.cancelAppointment = async (req, res) => {
  try {

    const { appointmentId } = req.body;


    // =====================================================
    // VALIDACIÓN
    // =====================================================

    if (!appointmentId) {
      return res.status(400).json({
        message:
          'El ID del turno es obligatorio',
      });
    }


    if (!req.user) {
      return res.status(401).json({
        message:
          'No estás autenticado',
      });
    }


    // =====================================================
    // BUSCAR TURNO
    // =====================================================

    const appointment =
      await Appointment.findById(
        appointmentId
      ).populate('client');


    if (!appointment) {
      return res.status(404).json({
        message:
          'El turno solicitado no existe',
      });
    }


    // =====================================================
    // CASO A
    // FRANJA DISPONIBLE
    //
    // Solo el barbero puede eliminarla.
    // =====================================================

    if (
      appointment.status === 'disponible'
    ) {

      if (req.user.role !== 'barber') {
        return res.status(403).json({
          message:
            'Solo un barbero puede eliminar una franja disponible',
        });
      }


      await Appointment.findByIdAndDelete(
        appointmentId
      );


      return res.status(200).json({
        message:
          'Franja horaria eliminada correctamente',
      });
    }


    // =====================================================
    // CASO B
    // TURNO OCUPADO
    // =====================================================

    if (
      appointment.status !== 'ocupado'
    ) {
      return res.status(400).json({
        message:
          'El estado del turno no es válido',
      });
    }


    const client = appointment.client;


    if (!client) {
      return res.status(400).json({
        message:
          'Este turno no tiene un cliente asociado',
      });
    }


    // =====================================================
    // SEGURIDAD
    //
    // Cliente:
    // solamente puede cancelar SU turno.
    //
    // Barbero:
    // puede liberar cualquier turno.
    // =====================================================

    if (req.user.role === 'client') {

      const clientId =
        client._id?.toString();

      const userId =
        req.user.id?.toString();


      if (
        !clientId ||
        !userId ||
        clientId !== userId
      ) {
        return res.status(403).json({
          message:
            'No podés cancelar el turno de otro cliente',
        });
      }
    }


    // =====================================================
    // GUARDAR DATOS ANTES DE DESVINCULAR AL CLIENTE
    // =====================================================

    const savedClientToken =
      client.pushSubscription || null;

    const appointmentTime =
      appointment.time;

    const appointmentDate =
      appointment.date;


    // =====================================================
    // LIBERAR TURNO
    // =====================================================

    appointment.status = 'disponible';
    appointment.client = null;

    await appointment.save();


    // =====================================================
    // NOTIFICACIÓN PUSH
    // =====================================================

    if (savedClientToken) {

      const payload = JSON.stringify({
        title: 'TURNO LIBERADO',

        body:
          `La barbería ha liberado tu turno ` +
          `del ${appointmentDate} a las ` +
          `${appointmentTime} hs. ` +
          `Ya podés ingresar y reservar otro horario.`,

        icon: '/logo.png',
      });


      try {

        await webpush.sendNotification(
          savedClientToken,
          payload
        );


        console.log(
          '✅ Push enviado correctamente'
        );

      } catch (pushError) {

        console.error(
          '❌ Error enviando push:',
          pushError
        );


        // =================================================
        // LIMPIAR SUSCRIPCIÓN PUSH INVÁLIDA
        // =================================================

        if (
          pushError.statusCode === 404 ||
          pushError.statusCode === 410
        ) {

          try {

            await User.findByIdAndUpdate(
              client._id,
              {
                $unset: {
                  pushSubscription: 1,
                },
              }
            );


            console.log(
              '🧹 Suscripción push inválida eliminada'
            );

          } catch (cleanupError) {

            console.error(
              'Error limpiando pushSubscription:',
              cleanupError
            );
          }
        }
      }
    }


    // =====================================================
    // RESPUESTA
    // =====================================================

    return res.status(200).json({
      message:
        'Horario liberado correctamente',

      appointment,
    });

  } catch (error) {

    console.error(
      'Error al procesar la cancelación:',
      error
    );


    return res.status(500).json({
      message:
        'Error al procesar la cancelación',

      error: error.message,
    });
  }
};
