const prisma = require('../config/db');

const gananciaDiaria = async (req, res) => {
  const { fecha } = req.query;
  try {
    const dia = fecha ? new Date(fecha) : new Date();
    dia.setHours(0, 0, 0, 0);
    const manana = new Date(dia);
    manana.setDate(manana.getDate() + 1);

    const pagos = await prisma.pago.findMany({
      where: { fecha_pago: { gte: dia, lt: manana } },
      include: { pedido: true }
    });

    const ingresos = pagos.reduce((s, p) => s + p.monto, 0);
    const costoEst = ingresos * 0.4;
    const gananciaNeta = ingresos - costoEst;

    res.json({
      fecha: dia.toISOString().split('T')[0],
      ingresos,
      costoEstimado: Math.round(costoEst * 100) / 100,
      gananciaNeta: Math.round(gananciaNeta * 100) / 100,
      porcentaje: ingresos > 0 ? Math.round((gananciaNeta / ingresos) * 100) : 0,
      totalTransacciones: pagos.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const gananciaPorRango = async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    const fechaDesde = desde ? new Date(desde) : new Date(new Date().setDate(new Date().getDate() - 30));
    fechaDesde.setHours(0, 0, 0, 0);
    const fechaHasta = hasta ? new Date(hasta) : new Date();
    fechaHasta.setHours(23, 59, 59, 999);

    const pagos = await prisma.pago.findMany({
      where: { fecha_pago: { gte: fechaDesde, lte: fechaHasta } },
      include: { pedido: true }
    });

    const ingresos = pagos.reduce((s, p) => s + p.monto, 0);
    const costoEst = ingresos * 0.4;
    const gananciaNeta = ingresos - costoEst;

    res.json({
      desde: fechaDesde.toISOString().split('T')[0],
      hasta: fechaHasta.toISOString().split('T')[0],
      ingresos,
      gananciaNeta: Math.round(gananciaNeta * 100) / 100,
      porcentaje: ingresos > 0 ? Math.round((gananciaNeta / ingresos) * 100) : 0,
      totalTransacciones: pagos.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { gananciaDiaria, gananciaPorRango };
