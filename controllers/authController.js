const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRAR UN USUARIO NUEVO EN LA NUBE (CLIENTES)
exports.register = async (req, res) => {
  try {
    const { name, phone, password, role } = req.body;

    // Verificar si el número de teléfono celular ya está registrado
    let userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: 'Este número de teléfono ya está registrado' });
    }

    // Encriptar la contraseña por seguridad
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear el nuevo documento de usuario
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      role: role || 'client' // Por defecto se registra como cliente
    });

    await newUser.save();

    // Generar el Token de acceso JWT automático
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, name: newUser.name },
      process.env.JWT_SECRET || 'secreto_jefatura_barber_app_99',
      { expiresIn: '365d' }
    );

    return res.status(201).json({
      message: 'Usuario registrado con éxito',
      token,
      user: { id: newUser._id, name: newUser.name, phone: newUser.phone, role: newUser.role }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor al registrar', error: error.message });
  }
};

// 2. INICIAR SESIÓN (LOGIN DE ENTRADA)
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Buscar al usuario por su número de celular
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'El número de teléfono o la contraseña son incorrectos' });
    }

    // Comparar la contraseña ingresada contra el hash encriptado de MongoDB Atlas
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'El número de teléfono o la contraseña son incorrectos' });
    }

    // Generar el pase de Token de seguridad de par en par
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'secreto_jefatura_barber_app_99',
      { expiresIn: '365d' }
    );

    return res.status(200).json({
      message: 'Ingreso al sistema exitoso',
      token,
      user: { id: user._id, name: user.name, phone: user.phone, role: user.role }
    });

  } catch (error) {
    return res.status(500).json({ message: 'Error en el servidor al iniciar sesión', error: error.message });
  }
};

// 3. 👑 EL ENDPOINT SOLICITADO: GUARDA EL TOKEN DE NOTIFICACIÓN DEL CELULAR DEL USUARIO
exports.saveSubscription = async (req, res) => {
  try {
    const { subscription } = req.body;
    
    // Buscar al usuario autenticado por token y inyectarle su dirección digital de PWA
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado en la base de datos' });
    }

    user.pushSubscription = subscription;
    await user.save();

    return res.status(200).json({ message: 'Suscripción Push enlazada con éxito en la nube de Atlas' });
  } catch (error) {
    return res.status(500).json({ message: 'Error al intentar guardar la suscripción push', error: error.message });
  }
};
