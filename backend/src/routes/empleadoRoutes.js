const express = require('express');
const router = express.Router();
const { listarEmpleados } = require('../controllers/empleadoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, listarEmpleados);

module.exports = router;
