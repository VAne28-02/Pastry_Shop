// USA ESTA LÍNEA EN SU LUGAR:
const prisma = require('../config/db'); // Importa la instancia ya configurada

const crearPedido = async (req, res) => {
  const usuarioId = req.usuario.id; 
  const { productos, total, metodo_pago } = req.body; 

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { usuario_id: usuarioId }
    });

    if (!cliente) return res.status(404).json({ message: "Perfil de cliente no encontrado" });

    const pedido = await prisma.$transaction(async (tx) => {
      const nuevoPedido = await tx.pedido.create({
        data: {
          cliente_id: cliente.id,
          total: total,
          estado: 'pendiente'
        }
      });

      const detallesData = productos.map(p => ({
        pedido_id: nuevoPedido.id,
        producto_id: p.producto_id,
        variante_id: p.variante_id,
        cantidad: p.cantidad,
        subtotal: p.subtotal
      }));

      await tx.detallePedido.createMany({ data: detallesData });

      await tx.pago.create({
        data: {
          pedido_id: nuevoPedido.id,
          monto: total,
          metodo_pago: metodo_pago || 'efectivo'
        }
      });

      return nuevoPedido;
    });

    res.status(201).json({ message: "Pedido realizado con éxito", pedido });
  } catch (error) {
    res.status(500).json({ error: "Error al crear pedido", details: error.message });
  }
};

const registrarPedidoDirecto = async (req, res) => {
  const { nombre, telefono, tipo, items, metodo_pago } = req.body;
  if (!nombre || !items?.length) return res.status(400).json({ error: "'nombre' y 'items' son requeridos." });

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const cliente = telefono
        ? await tx.cliente.upsert({
            where: { telefono },
            update: { nombre },
            create: { telefono, nombre }
          })
        : await tx.cliente.create({ data: { nombre } });

      let total = 0;
      const detallesData = [];
      for (const item of items) {
        const prod = await tx.producto.findUnique({ where: { id: item.producto_id } });
        if (!prod) throw new Error(`Producto id ${item.producto_id} no encontrado`);
        const subtotal = prod.precio_base * item.cantidad;
        total += subtotal;
        detallesData.push({
          producto_id: prod.id,
          cantidad: item.cantidad,
          subtotal
        });
      }

      const pedido = await tx.pedido.create({
        data: {
          cliente_id: cliente.id,
          total,
          tipo: tipo || 'aqui',
          detalles: { create: detallesData }
        }
      });

      await tx.pago.create({
        data: {
          pedido_id: pedido.id,
          monto: total,
          metodo_pago: metodo_pago || 'efectivo'
        }
      });

      return pedido;
    });

    res.status(201).json({ success: true, data: resultado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const limpiarPedidosPorFecha = async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ error: "'fecha' (YYYY-MM-DD) es requerida." });

  try {
    const inicio = new Date(fecha + 'T00:00:00');
    const fin = new Date(fecha + 'T23:59:59.999');

    const pedidos = await prisma.pedido.findMany({
      where: { fecha_creacion: { gte: inicio, lte: fin } },
      select: { id: true }
    });

    if (pedidos.length === 0) return res.json({ success: true, eliminados: 0 });

    const ids = pedidos.map(p => p.id);

    await prisma.$transaction(async (tx) => {
      await tx.detallePedido.deleteMany({ where: { pedido_id: { in: ids } } });
      await tx.pago.deleteMany({ where: { pedido_id: { in: ids } } });
      await tx.pedido.deleteMany({ where: { id: { in: ids } } });
    });

    res.json({ success: true, eliminados: ids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const registrarPedidoPromo = async (req, res) => {
  const { nombre, telefono, tipo, promoTitulo } = req.body;
  if (!nombre) return res.status(400).json({ error: "'nombre' es requerido." });

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const cliente = telefono
        ? await tx.cliente.upsert({
            where: { telefono },
            update: { nombre },
            create: { telefono, nombre }
          })
        : await tx.cliente.create({ data: { nombre } });

      const pedido = await tx.pedido.create({
        data: {
          cliente_id: cliente.id,
          total: 0,
          tipo: tipo || 'aqui',
          estado: 'pendiente'
        }
      });

      await tx.pago.create({
        data: {
          pedido_id: pedido.id,
          monto: 0,
          metodo_pago: 'promocion'
        }
      });

      return pedido;
    });

    res.status(201).json({ success: true, data: resultado, mensaje: 'Promoción registrada en pedidos' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { crearPedido, registrarPedidoDirecto, limpiarPedidosPorFecha, registrarPedidoPromo };