const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, pagoController.listarPagos);

module.exports = router;
