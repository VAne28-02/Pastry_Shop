// src/controllers/authController.js
const prisma = require('../config/db'); // Importación única y correcta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrar = async (req, res) => {
  const { email, password, nombre, telefono, cargo, rol } = req.body;
  const tipoRol = rol === 'empleado' ? 'Empleado' : 'Cliente';
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ message: "El email ya está registrado" });

    const password_hash = await bcrypt.hash(password, 6);
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password_hash,
        rol: {
          connectOrCreate: {
            where: { nombre: tipoRol },
            create: { nombre: tipoRol }
          }
        }
      }
    });
    if (tipoRol === 'Empleado') {
      await prisma.empleado.create({
        data: { usuario_id: usuario.id, nombre, cargo: cargo || 'Empleado' }
      });
    } else if (telefono) {
      await prisma.cliente.upsert({
        where: { telefono },
        update: { usuario_id: usuario.id, nombre },
        create: { usuario_id: usuario.id, nombre, telefono }
      });
    } else {
      await prisma.cliente.create({
        data: { usuario_id: usuario.id, nombre }
      });
    }
    res.status(201).json({ message: `${tipoRol} registrado`, usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empleado: true, cliente: true, rol: true }
    });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return res.status(401).json({ message: "Contraseña incorrecta" });
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const perfil = usuario.empleado || usuario.cliente || { nombre: "Usuario" };
    res.json({ token, perfil, rol: usuario.rol_id, rol_nombre: usuario.rol.nombre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registrar, login };