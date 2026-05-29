const prisma = require('../config/db');

const listarCategorias = async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: { productos: { where: { disponible: true } } },
      orderBy: { id: 'asc' }
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearCategoria = async (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "El campo 'nombre' es requerido." });
  try {
    const categoria = await prisma.categoria.create({ data: { nombre } });
    res.status(201).json(categoria);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, activa } = req.body;
  try {
    const idCategoria = parseInt(id);
    if (isNaN(idCategoria)) return res.status(400).json({ error: "ID inválido." });
    const categoria = await prisma.categoria.update({
      where: { id: idCategoria },
      data: { ...(nombre && { nombre }), ...(activa !== undefined && { activa }) }
    });
    res.json(categoria);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Categoría no encontrada." });
    res.status(500).json({ error: error.message });
  }
};

const eliminarCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const idCategoria = parseInt(id);
    if (isNaN(idCategoria)) return res.status(400).json({ error: "ID inválido." });
    await prisma.categoria.delete({ where: { id: idCategoria } });
    res.json({ message: "Categoría eliminada." });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Categoría no encontrada." });
    if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) return res.status(409).json({ error: "No se puede eliminar: la categoría tiene productos asociados. Elimina o reasigna los productos primero." });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };
