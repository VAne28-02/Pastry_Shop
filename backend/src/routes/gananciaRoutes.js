const express = require('express');
const router = express.Router();
const gananciaController = require('../controllers/gananciaController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/diaria', verificarToken, gananciaController.gananciaDiaria);
router.get('/rango', verificarToken, gananciaController.gananciaPorRango);

module.exports = router;
