const express = require('express');
const router = express.Router();
const { listarCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } = require('../controllers/categoriaController');

router.get('/', listarCategorias);
router.post('/', crearCategoria);
router.put('/:id', actualizarCategoria);
router.delete('/:id', eliminarCategoria);

module.exports = router;
