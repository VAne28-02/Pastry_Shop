const prisma = require('../config/db');

const listarPromos = async (req, res) => {
  try {
    const promos = await prisma.promo.findMany({ orderBy: { id: 'desc' } });
    res.json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearPromo = async (req, res) => {
  const { titulo, descripcion, precio, icono } = req.body;
  if (!titulo || !descripcion) return res.status(400).json({ error: "'titulo' y 'descripcion' son requeridos." });
  try {
    const data = { titulo, descripcion, precio: parseFloat(precio) || 0, icono: icono || '🎉' };
    const promo = await prisma.promo.create({ data });
    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarPromo = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, precio, icono, activa } = req.body;
  try {
    const data = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (precio !== undefined) data.precio = parseFloat(precio);
    if (icono !== undefined) data.icono = icono;
    if (activa !== undefined) data.activa = activa;
    const promo = await prisma.promo.update({ where: { id: parseInt(id) }, data });
    res.json({ success: true, data: promo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarPromo = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.promo.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarPromos, crearPromo, editarPromo, eliminarPromo };
