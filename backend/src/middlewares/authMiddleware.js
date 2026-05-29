const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  // Obtenemos el token del header Authorization: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: "Acceso denegado: Se requiere token" });
  }

  try {
    // Verificamos el token con la misma clave secreta del login
    const usuarioVerificado = jwt.verify(token, process.env.JWT_SECRET);
    
    // Guardamos la info del usuario en el objeto 'req' para usarla en el siguiente controlador
    req.usuario = usuarioVerificado; 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

module.exports = { verificarToken };