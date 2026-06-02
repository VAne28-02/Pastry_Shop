const prisma = require('../config/db');

const listarIngredientes = async (req, res) => {
  try {
    const ingredientes = await prisma.ingrediente.findMany({ orderBy: { nombre: 'asc' } });
    res.json(ingredientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearIngrediente = async (req, res) => {
  const { nombre, unidad_medida, costo_por_unidad, stock_actual, stock_minimo } = req.body;
  if (!nombre || !unidad_medida) return res.status(400).json({ error: "'nombre' y 'unidad_medida' son requeridos." });
  try {
    const ingrediente = await prisma.ingrediente.create({
      data: { nombre, unidad_medida, costo_por_unidad: costo_por_unidad || 0, stock_actual: stock_actual || 0, stock_minimo: stock_minimo || 0 }
    });
    res.status(201).json(ingrediente);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarStock = async (req, res) => {
  const { id } = req.params;
  const { cantidad, tipo } = req.body;
  if (!cantidad || !tipo) return res.status(400).json({ error: "'cantidad' y 'tipo' (entrada/salida) son requeridos." });
  try {
    const idIng = parseInt(id);
    if (isNaN(idIng)) return res.status(400).json({ error: "ID inválido." });

    const ingrediente = await prisma.ingrediente.findUnique({ where: { id: idIng } });
    if (!ingrediente) return res.status(404).json({ error: "Ingrediente no encontrado." });

    const ajuste = tipo === 'entrada' ? cantidad : -cantidad;
    const nuevoStock = Math.max(0, ingrediente.stock_actual + ajuste);

    const actualizado = await prisma.ingrediente.update({
      where: { id: idIng },
      data: { stock_actual: nuevoStock }
    });
    res.json(actualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarIngrediente = async (req, res) => {
  const { id } = req.params;
  const { nombre, unidad_medida, costo_por_unidad, stock_actual, stock_minimo } = req.body;
  try {
    const idIng = parseInt(id);
    if (isNaN(idIng)) return res.status(400).json({ error: "ID inválido." });
    const data = {};
    if (nombre !== undefined && nombre) data.nombre = nombre;
    if (unidad_medida !== undefined && unidad_medida) data.unidad_medida = unidad_medida;
    if (costo_por_unidad !== undefined) data.costo_por_unidad = costo_por_unidad;
    if (stock_actual !== undefined) data.stock_actual = stock_actual;
    if (stock_minimo !== undefined) data.stock_minimo = stock_minimo;
    const actualizado = await prisma.ingrediente.update({ where: { id: idIng }, data });
    res.json(actualizado);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Ingrediente no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

const eliminarIngrediente = async (req, res) => {
  const { id } = req.params;
  try {
    const idIng = parseInt(id);
    if (isNaN(idIng)) return res.status(400).json({ error: "ID inválido." });
    await prisma.ingrediente.delete({ where: { id: idIng } });
    res.json({ success: true });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Ingrediente no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarIngredientes, crearIngrediente, actualizarStock, actualizarIngrediente, eliminarIngrediente };
