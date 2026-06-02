const prisma = require('../config/db');

const listarProductos = async (req, res) => {
  try {
    const { categoria, busqueda } = req.query;
    const filtro = { where: { disponible: true } };

    if (categoria) filtro.where.categoria_id = parseInt(categoria);
    if (busqueda) filtro.where.nombre = { contains: busqueda, mode: 'insensitive' };

    const productos = await prisma.producto.findMany({ ...filtro, include: { categoria: true } });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const idProducto = parseInt(id);
    if (isNaN(idProducto)) return res.status(400).json({ error: "ID inválido." });
    const producto = await prisma.producto.findUnique({ where: { id: idProducto }, include: { categoria: true } });
    if (!producto) return res.status(404).json({ error: "Producto no encontrado." });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearProducto = async (req, res) => {
  const { nombre, descripcion, precio_base, categoria_id, imagen_url, disponible, stock } = req.body;
  if (!nombre || !precio_base || !categoria_id) return res.status(400).json({ error: "'nombre', 'precio_base' y 'categoria_id' son requeridos." });
  try {
    const producto = await prisma.producto.create({
      data: { nombre, descripcion, precio_base, categoria_id, imagen_url, disponible, stock: parseInt(stock) || 0 }
    });
    res.status(201).json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_base, categoria_id, imagen_url, disponible, stock } = req.body;
  try {
    const idProducto = parseInt(id);
    if (isNaN(idProducto)) return res.status(400).json({ error: "ID inválido." });
    const data = {};
    if (nombre) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (precio_base) data.precio_base = precio_base;
    if (categoria_id) data.categoria_id = categoria_id;
    if (imagen_url !== undefined) data.imagen_url = imagen_url;
    if (disponible !== undefined) data.disponible = disponible;
    if (stock !== undefined) data.stock = parseInt(stock);
    const producto = await prisma.producto.update({ where: { id: idProducto }, data });
    res.json(producto);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Producto no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

const actualizarStockProducto = async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  if (stock === undefined) return res.status(400).json({ error: "'stock' es requerido." });
  try {
    const idProd = parseInt(id);
    if (isNaN(idProd)) return res.status(400).json({ error: "ID inválido." });
    const producto = await prisma.producto.update({
      where: { id: idProd },
      data: { stock: Math.max(0, stock) }
    });
    res.json(producto);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Producto no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const idProducto = parseInt(id);
    if (isNaN(idProducto)) return res.status(400).json({ error: "ID inválido." });
    await prisma.producto.delete({ where: { id: idProducto } });
    res.json({ message: "Producto eliminado." });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Producto no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarProductos, obtenerProducto, crearProducto, actualizarProducto, actualizarStockProducto, eliminarProducto };