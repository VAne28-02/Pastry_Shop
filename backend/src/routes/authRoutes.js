// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registrarCliente, login } = require('../controllers/authController');

router.post('/registrar', registrarCliente);
router.post('/login', login);

module.exports = router;