// src/config/db.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Configuración del pool de conexión nativo de Postgres
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const adapter = new PrismaPg(pool);

// Instancia única de Prisma para todo el proyecto
const prisma = new PrismaClient({ adapter });

module.exports = prisma;