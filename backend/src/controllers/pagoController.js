const prisma = require('../config/db');

const listarPagos = async (req, res) => {
  try {
    const pagos = await prisma.pago.findMany({
      include: { pedido: { include: { cliente: true } } },
      orderBy: { fecha_pago: 'desc' }
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarPagos };
