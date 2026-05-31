const express = require('express');
const router = express.Router();
const { listarProductos, obtenerProducto, crearProducto, actualizarProducto, actualizarStockProducto, eliminarProducto } = require('../controllers/productoController');

router.get('/', listarProductos);
router.get('/:id', obtenerProducto);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.put('/:id/stock', actualizarStockProducto);
router.delete('/:id', eliminarProducto);

module.exports = router;