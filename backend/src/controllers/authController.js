// src/controllers/authController.js
const prisma = require('../config/db'); // Importación única y correcta
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registrarCliente = async (req, res) => {
  const { email, password, nombre, telefono } = req.body;
  try {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(409).json({ message: "El email ya está registrado" });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          email,
          password_hash,
          rol: {
            connectOrCreate: {
              where: { nombre: 'Cliente' },
              create: { nombre: 'Cliente' }
            }
          }
        }
      });
      const cliente = telefono
        ? await tx.cliente.upsert({
            where: { telefono },
            update: { usuario_id: usuario.id, nombre },
            create: { usuario_id: usuario.id, nombre, telefono }
          })
        : await tx.cliente.create({
            data: { usuario_id: usuario.id, nombre }
          });
      return { usuario, cliente };
    });
    res.status(201).json({ message: "Cliente registrado", usuario: resultado.usuario });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      include: { empleado: true, cliente: true }
    });
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) return res.status(401).json({ message: "Contraseña incorrecta" });
    const token = jwt.sign({ id: usuario.id, rol_id: usuario.rol_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const perfil = usuario.empleado || usuario.cliente || { nombre: "Usuario" };
    res.json({ token, perfil, rol: usuario.rol_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { registrarCliente, login };