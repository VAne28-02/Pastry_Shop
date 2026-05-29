// USA ESTA LÍNEA EN SU LUGAR:
const prisma = require('../config/db'); // Importa la instancia ya configurada

const crearPedido = async (req, res) => {
  // req.usuario viene del middleware (contiene el ID del usuario logueado)
  const usuarioId = req.usuario.id; 
  const { productos, total } = req.body; 

  try {
    // 1. Buscamos el ID de cliente asociado a ese usuario
    const cliente = await prisma.cliente.findUnique({
      where: { usuario_id: usuarioId }
    });

    if (!cliente) return res.status(404).json({ message: "Perfil de cliente no encontrado" });

    // 2. Transacción: Crear Pedido y Detalles
    const pedido = await prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          cliente_id: cliente.id,
          total: total,
          estado: 'pendiente'
        }
      });

      // Creamos los detalles del pedido
      const detallesData = productos.map(p => ({
        pedido_id: nuevoPedido.id,
        producto_id: p.producto_id,
        variante_id: p.variante_id,
        cantidad: p.cantidad,
        subtotal: p.subtotal
      }));

      await tx.detallePedido.createMany({ data: detallesData });
      return nuevoPedido;
    });

    res.status(201).json({ message: "Pedido realizado con éxito", pedido });
  } catch (error) {
    res.status(500).json({ error: "Error al crear pedido", details: error.message });
  }
};

module.exports = { crearPedido };