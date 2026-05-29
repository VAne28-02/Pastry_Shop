const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { crearPedido } = require('../controllers/pedidoController');

// Solo usuarios con token válido pueden hacer pedidos
router.post('/nuevo', verificarToken, crearPedido);

module.exports = router;