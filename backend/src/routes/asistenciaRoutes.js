const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { marcarAsistencia, obtenerAsistencia, adminMarcarAsistencia, crearAsistencia, editarAsistencia } = require('../controllers/asistenciaController');

router.post('/marcar', verificarToken, marcarAsistencia);
router.post('/admin/marcar', verificarToken, adminMarcarAsistencia);
router.post('/', verificarToken, crearAsistencia);
router.put('/:id', verificarToken, editarAsistencia);
router.get('/', verificarToken, obtenerAsistencia);

module.exports = router;
