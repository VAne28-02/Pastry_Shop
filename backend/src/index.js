// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./config/db');

// --- CORRECCIÓN DE RUTAS ---
// Como index.js está en /src, las carpetas están al mismo nivel
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const pagoRoutes = require('./routes/pagoRoutes');
const gananciaRoutes = require('./routes/gananciaRoutes');
const ingredienteRoutes = require('./routes/ingredienteRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/ganancia', gananciaRoutes);
app.use('/api/ingredientes', ingredienteRoutes);
app.use('/api/empleados', empleadoRoutes);

// ... resto de tu código igual ...

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);

});