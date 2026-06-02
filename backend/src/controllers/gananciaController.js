const prisma = require('../config/db');

const gananciaDiaria = async (req, res) => {
  const { fecha } = req.query;
  try {
    const diaStr = fecha || new Date().toISOString().split('T')[0];
    const dia = new Date(diaStr + 'T00:00:00.000');
    const manana = new Date(diaStr + 'T23:59:59.999');

    const pagos = await prisma.pago.findMany({
      where: { fecha_pago: { gte: dia, lte: manana } },
      include: { pedido: true }
    });

    const ingresos = pagos.reduce((s, p) => s + p.monto, 0);
    const costoEst = ingresos * 0.4;
    const gananciaNeta = ingresos - costoEst;

    res.json({
      fecha: diaStr,
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
    const hoy = new Date().toISOString().split('T')[0];
    const fechaDesde = new Date((desde || hoy) + 'T00:00:00.000');
    const fechaHasta = new Date((hasta || hoy) + 'T23:59:59.999');

    const pagos = await prisma.pago.findMany({
      where: { fecha_pago: { gte: fechaDesde, lte: fechaHasta } },
      include: { pedido: true }
    });

    const ingresos = pagos.reduce((s, p) => s + p.monto, 0);
    const costoEst = ingresos * 0.4;
    const gananciaNeta = ingresos - costoEst;

    res.json({
      desde: desde || hoy,
      hasta: hasta || hoy,
      ingresos,
      gananciaNeta: Math.round(gananciaNeta * 100) / 100,
      porcentaje: ingresos > 0 ? Math.round((gananciaNeta / ingresos) * 100) : 0,
      totalTransacciones: pagos.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const gananciaDiariaRango = async (req, res) => {
  const { desde, hasta } = req.query;
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaDesde = new Date((desde || hoy) + 'T00:00:00.000');
    const fechaHasta = new Date((hasta || hoy) + 'T23:59:59.999');

    const pagos = await prisma.pago.findMany({
      where: { fecha_pago: { gte: fechaDesde, lte: fechaHasta } },
      include: { pedido: true },
      orderBy: { fecha_pago: 'asc' }
    });

    const dias = {};
    for (const p of pagos) {
      const dia = p.fecha_pago.toISOString().split('T')[0];
      if (!dias[dia]) dias[dia] = { ingresos: 0, transacciones: 0 };
      dias[dia].ingresos += p.monto;
      dias[dia].transacciones++;
    }

    const datosDiarios = Object.entries(dias).map(([fecha, d]) => ({
      fecha,
      ingresos: Math.round(d.ingresos * 100) / 100,
      costoEstimado: Math.round(d.ingresos * 0.4 * 100) / 100,
      gananciaNeta: Math.round((d.ingresos - d.ingresos * 0.4) * 100) / 100,
      porcentaje: d.ingresos > 0 ? 60 : 0,
      transacciones: d.transacciones
    })).sort((a, b) => b.fecha.localeCompare(a.fecha));

    res.json({ success: true, data: datosDiarios });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { gananciaDiaria, gananciaPorRango, gananciaDiariaRango };
