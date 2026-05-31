const express = require('express');
const router = express.Router();
const ingredienteController = require('../controllers/ingredienteController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, ingredienteController.listarIngredientes);
router.post('/', verificarToken, ingredienteController.crearIngrediente);
router.put('/:id', verificarToken, ingredienteController.actualizarIngrediente);
router.put('/:id/stock', verificarToken, ingredienteController.actualizarStock);
router.delete('/:id', verificarToken, ingredienteController.eliminarIngrediente);

module.exports = router;
