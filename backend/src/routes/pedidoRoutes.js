const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { crearPedido, registrarPedidoDirecto, limpiarPedidosPorFecha, registrarPedidoPromo } = require('../controllers/pedidoController');

router.post('/nuevo', verificarToken, crearPedido);
router.post('/registrar', registrarPedidoDirecto);
router.delete('/limpiar', verificarToken, limpiarPedidosPorFecha);
router.post('/promo', registrarPedidoPromo);

module.exports = router;