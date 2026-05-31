const { responderPreguntaConHistorial } = require('../services/chatbotService');
const prisma = require('../config/db');
// Función que ya tenías (o adaptada)
const enviarMensaje = async (req, res) => {
  const { telefono, remitente, mensaje, rol, email, nombre_usuario } = req.body;
  const identificador = telefono || remitente;
  if (!identificador || !mensaje) return res.status(400).json({ success: false, mensaje: "Campos requeridos." });

  try {
    const contexto = { rol, email, nombre_usuario };
    const resultado = await responderPreguntaConHistorial(identificador, mensaje, contexto);
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
        cliente: true,
        pagos: true
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
      include: { detalles: { include: { producto: true } }, cliente: true, pagos: true }
    });
    if (!pedido) return res.status(404).json({ success: false, error: "Pedido no encontrado." });
    res.json({ success: true, data: pedido });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
const obtenerHistorial = async (req, res) => {
  const { remitente } = req.query;
  if (!remitente) return res.status(400).json({ success: false, mensaje: "'remitente' es requerido." });
  try {
    const sesion = await prisma.sesionChat.findFirst({
      where: { telefono_whatsapp: remitente.toString(), estado_sesion: 'activa' },
      include: { mensajes: { orderBy: { fecha_hora: 'asc' }, take: 20 } }
    });
    if (!sesion) return res.json({ success: true, data: [] });
    const mensajes = sesion.mensajes.map(m => ({
      role: m.emisor === 'bot' ? 'bot' : 'user',
      content: m.contenido_mensaje
    }));
    res.json({ success: true, data: mensajes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { enviarMensaje, obtenerPedidos, actualizarEstadoPedido, obtenerPedidoPorId, obtenerHistorial };