const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { listarPromos, crearPromo, editarPromo, eliminarPromo } = require('../controllers/promoController');

router.get('/', listarPromos);
router.post('/', verificarToken, crearPromo);
router.put('/:id', verificarToken, editarPromo);
router.delete('/:id', verificarToken, eliminarPromo);

module.exports = router;
