const { responderPreguntaConHistorial } = require('../services/chatbotService');
const prisma = require('../config/db');
// Función que ya tenías (o adaptada)
const enviarMensaje = async (req, res) => {
  const { telefono, remitente, mensaje } = req.body;
  const identificador = telefono || remitente;
  if (!identificador || !mensaje) return res.status(400).json({ success: false, mensaje: "Campos requeridos." });

  try {
    const resultado = await responderPreguntaConHistorial(identificador, mensaje);
    res.json({ success: true, ...resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        detalles: { include: { producto: true } },
        cliente: true
      },
      orderBy: { id: 'desc' }
    });
    res.json({ success: true, data: pedidos });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ success: false, error: "Error al recuperar los pedidos." });
  }
};
const actualizarEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { nuevoEstado } = req.body;

  if (!nuevoEstado) return res.status(400).json({ success: false, error: "El campo 'nuevoEstado' es requerido." });

  const estadosValidos = ['pendiente', 'PREPARANDO', 'LISTO', 'entregado', 'cancelado'];
  if (!estadosValidos.includes(nuevoEstado)) {
    return res.status(400).json({ success: false, error: `Estado inválido. Válidos: ${estadosValidos.join(', ')}` });
  }

  try {
    const idPedido = parseInt(id);
    if (isNaN(idPedido)) return res.status(400).json({ success: false, error: "ID inválido." });

    const pedidoActualizado = await prisma.pedido.update({
      where: { id: idPedido },
      data: { estado: nuevoEstado }
    });
    res.json({ success: true, data: pedidoActualizado });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, error: "Pedido no encontrado." });
    res.status(500).json({ success: false, error: error.message });
  }
};

const obtenerPedidoPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const idPedido = parseInt(id);
    if (isNaN(idPedido)) return res.status(400).json({ success: false, error: "ID inválido." });

    const pedido = await prisma.pedido.findUnique({
      where: { id: idPedido },
      include: { detalles: { include: { producto: true } }, cliente: true }
    });
    if (!pedido) return res.status(404).json({ success: false, error: "Pedido no encontrado." });
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
module.exports = { enviarMensaje, obtenerPedidos, actualizarEstadoPedido, obtenerPedidoPorId };