const prisma = require('../config/db');

const marcarAsistencia = async (req, res) => {
  const usuarioId = req.usuario.id;
  try {
    const empleado = await prisma.empleado.findUnique({ where: { usuario_id: usuarioId } });
    if (!empleado) return res.status(404).json({ error: "Perfil de empleado no encontrado." });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const existente = await prisma.asistencia.findFirst({
      where: { empleado_id: empleado.id, hora_entrada: { gte: hoy, lt: manana } }
    });

    if (!existente) {
      const asistencia = await prisma.asistencia.create({
        data: { empleado_id: empleado.id }
      });
      return res.json({ success: true, tipo: 'entrada', data: asistencia });
    }

    if (!existente.hora_salida) {
      const asistencia = await prisma.asistencia.update({
        where: { id: existente.id },
        data: { hora_salida: new Date() }
      });
      return res.json({ success: true, tipo: 'salida', data: asistencia });
    }

    res.status(400).json({ error: "Ya registraste entrada y salida hoy." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerAsistencia = async (req, res) => {
  const usuarioId = req.usuario.id;
  const { fecha, desde, hasta, empleado_id } = req.query;
  try {
    const empleado = await prisma.empleado.findUnique({ where: { usuario_id: usuarioId } });
    if (!empleado) return res.status(404).json({ error: "Perfil de empleado no encontrado." });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const empId = empleado_id ? parseInt(empleado_id) : empleado.id;

    const asistencia = await prisma.asistencia.findFirst({
      where: { empleado_id: empId, hora_entrada: { gte: hoy, lt: manana } }
    });

    let filtroFecha = {};
    if (fecha) {
      const d = new Date(fecha);
      d.setHours(0, 0, 0, 0);
      const d2 = new Date(d);
      d2.setDate(d2.getDate() + 1);
      filtroFecha = { hora_entrada: { gte: d, lt: d2 } };
    } else if (desde || hasta) {
      const dDesde = desde ? new Date(desde) : new Date(0);
      dDesde.setHours(0, 0, 0, 0);
      const dHasta = hasta ? new Date(hasta) : new Date();
      dHasta.setHours(23, 59, 59, 999);
      filtroFecha = { hora_entrada: { gte: dDesde, lte: dHasta } };
    }

    const historial = await prisma.asistencia.findMany({
      where: { empleado_id: empId, ...filtroFecha },
      include: { empleado: { select: { nombre: true, cargo: true } } },
      orderBy: { hora_entrada: 'desc' },
      take: 50
    });

    res.json({ success: true, hoy: asistencia, historial });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const adminMarcarAsistencia = async (req, res) => {
  const { empleado_id } = req.body;
  if (!empleado_id) return res.status(400).json({ error: "'empleado_id' es requerido." });
  try {
    const empleado = await prisma.empleado.findUnique({ where: { id: empleado_id } });
    if (!empleado) return res.status(404).json({ error: "Empleado no encontrado." });

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const existente = await prisma.asistencia.findFirst({
      where: { empleado_id, hora_entrada: { gte: hoy, lt: manana } }
    });

    if (!existente) {
      const asistencia = await prisma.asistencia.create({ data: { empleado_id } });
      return res.json({ success: true, tipo: 'entrada', data: asistencia });
    }

    if (!existente.hora_salida) {
      const asistencia = await prisma.asistencia.update({
        where: { id: existente.id },
        data: { hora_salida: new Date() }
      });
      return res.json({ success: true, tipo: 'salida', data: asistencia });
    }

    res.status(400).json({ error: "Ya registró entrada y salida hoy." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const crearAsistencia = async (req, res) => {
  const { empleado_id, fecha, hora_entrada, hora_salida } = req.body;
  if (!empleado_id || !fecha || !hora_entrada) return res.status(400).json({ error: "'empleado_id', 'fecha' y 'hora_entrada' son requeridos." });
  try {
    const fechaEntrada = new Date(`${fecha}T${hora_entrada}`);
    const data = { empleado_id, hora_entrada: fechaEntrada };
    if (hora_salida) data.hora_salida = new Date(`${fecha}T${hora_salida}`);

    const asistencia = await prisma.asistencia.create({ data });
    res.status(201).json({ success: true, data: asistencia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const editarAsistencia = async (req, res) => {
  const { id } = req.params;
  const { hora_entrada, hora_salida } = req.body;
  try {
    const idAsis = parseInt(id);
    if (isNaN(idAsis)) return res.status(400).json({ error: "ID inválido." });
    if (!hora_entrada && !hora_salida) return res.status(400).json({ error: "Debe enviar al menos un campo." });

    const existente = await prisma.asistencia.findUnique({ where: { id: idAsis } });
    if (!existente) return res.status(404).json({ error: "Registro no encontrado." });

    const updateData = {};
    if (hora_entrada) updateData.hora_entrada = hora_entrada;
    if (hora_salida !== undefined) updateData.hora_salida = hora_salida;

    const asistencia = await prisma.asistencia.update({
      where: { id: idAsis },
      data: updateData
    });
    res.json({ success: true, data: asistencia });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: "Registro no encontrado." });
    res.status(500).json({ error: error.message });
  }
};

module.exports = { marcarAsistencia, obtenerAsistencia, adminMarcarAsistencia, crearAsistencia, editarAsistencia };
