const express = require('express');
const router = express.Router();
const { generarFactura } = require('../controllers/invoiceController');

router.get('/:id', generarFactura);

module.exports = router;
