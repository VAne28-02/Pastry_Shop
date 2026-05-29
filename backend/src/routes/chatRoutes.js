const express = require('express');
const router = express.Router();
// Importamos las funciones desde el controlador
const { enviarMensaje, obtenerPedidos, actualizarEstadoPedido, obtenerPedidoPorId } = require('../controllers/chatController');

// Ruta para enviar mensajes (POST)
// Nota: Ahora llamarás a esta ruta usando: /api/chat/enviar
router.post('/enviar', enviarMensaje);

// Ruta para ver todos los pedidos (GET)
// Nota: Llamarás a esta ruta usando: /api/chat/pedidos
router.get('/pedidos', obtenerPedidos);


router.put('/pedido/:id/estado', actualizarEstadoPedido);
router.get('/pedido/:id', obtenerPedidoPorId);

module.exports = router;