const prisma = require('../config/db');

const listarEmpleados = async (req, res) => {
  try {
    const empleados = await prisma.empleado.findMany({
      include: { usuario: { select: { email: true } } },
      orderBy: { cargo: 'asc' }
    });
    res.json(empleados);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { listarEmpleados };
