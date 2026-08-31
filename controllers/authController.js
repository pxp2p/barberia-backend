const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. CONTROLADOR PARA REGISTRAR USUARIOS NUEVOS
exports.register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || 'client'
    });

    await newUser.save();
    return res.status(201).json({ message: 'Usuario registrado con éxito' });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// 2. CONTROLADOR DE LOGIN REAL ASOCIADO A TU MONGODB ATLAS
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secreto_temporal_barberia',
      { expiresIn: '24h' }
    );

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
