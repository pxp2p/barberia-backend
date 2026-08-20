const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. REGISTRO DE USUARIOS (SÓLO CELULAR Y NOMBRE)
exports.register = async (req, res) => {
    try {
        const { name, phone, password, role } = req.body;

        // Validamos si el celular ya existe en el sistema
        const userExists = await User.findOne({ phone });
        if (userExists) {
            return res.status(400).json({ message: 'Este número de celular ya está registrado' });
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
        res.status(201).json({ message: 'Usuario registrado con éxito' });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};

// 2. INICIO DE SESIÓN POR TELÉFONO (CON ACCESO DIRECTO BLINDADO PARA JOACO)
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        // ACCESO DIRECTO REAL DE JOAQUIN
        if (phone === '1128884710' && password === 'joaquin2603') {
            const token = jwt.sign(
                { id: '65f1c40f1234567890abcdef', role: 'barber' },
                process.env.JWT_SECRET || 'secreto_temporal_barberia',
                { expiresIn: '24h' }
            );

            return res.status(200).json({
                message: 'Login exitoso',
                token,
                user: {
                    id: '65f1c40f1234567890abcdef',
                    name: 'Joaquín El Barbero',
                    role: 'barber',
                    phone: '1128884710'
                }
            });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secreto_temporal_barberia',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                phone: user.phone
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor', error: error.message });
    }
};
