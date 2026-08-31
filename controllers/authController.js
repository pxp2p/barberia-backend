const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. CONTROLADOR PARA REGISTRAR USUARIOS NUEVOS EN LA BASE DE DATOS
exports.register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    // Verificar si el teléfono ya está registrado en MongoDB
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
    }

    // Encriptar la contraseña de forma segura antes de guardarla
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo usuario en el sistema
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || 'client' // Si no se especifica, por defecto es un cliente
    });

    await newUser.save();
    return res.status(201).json({ message: 'Usuario registrado con éxito' });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 2. CONTROLADOR DE LOGIN REAL ASOCIADO A TU MONGODB ATLAS (SIN LOGINS FALSOS)
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Buscar el usuario real en las tablas de la base de datos por su teléfono
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Verificar si la clave ingresada coincide con la guardada encriptada
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar el token de seguridad verdadero con el ID real de MongoDB Atlas
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secreto_temporal_barberia',
      { expiresIn: '24h' }
    );

    // Devolver la respuesta oficial limpia al Frontend
    return res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
