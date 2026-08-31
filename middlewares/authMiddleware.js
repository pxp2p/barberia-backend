const jwt = require('jsonwebtoken');

// FILTRO DE VERIFICACIÓN ABSOLUTA DE TOKENS EN LA RED
module.exports = (req, res, next) => {
  // Capturar el token que viaja en la cabecera de la petición de Vercel
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Acceso denegado. No se encontró ningún token de seguridad' });
  }

  // Descomponer el formato estándar "Bearer TOKEN_AQUÍ"
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    // Descifrar el token usando la clave maestra (idéntica a la configurada en app.js)
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal_barberia');
    
    // Inyectar los datos reales del usuario descifrado adentro de la petición (req.user)
    req.user = verified;
    
    // Dar el pase libre para que avance al controlador de base de datos
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token de seguridad inválido o expirado' });
  }
};
