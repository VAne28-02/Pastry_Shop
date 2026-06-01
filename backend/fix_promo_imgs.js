require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Map DB promo titles -> actual filenames in /promos/ folder
const mapas = {
  'Desayuno Consciente': 'Desayuno Consciente.png',
  'Combo Oficina': 'Combo Oficina.png',
  'Regalo Bienestar': 'Regalo Bienestar.png',
  'Dúo Antioxidante': 'Dúo Antioxidante.png',
  'Energy Pack': 'Energy Pack.png',
  'Tarde Relaj': 'tarde relaj.png',
  'Ruta del Cacao Saludable': 'Ruta del Cacao.png',
  'Cítrico Revital': 'Cítrico Revital.png',
  'Brunch NuConexion': 'Brunch NuConexion.png',
  'Energy Rush': 'Energy Rush.png', // no 
};

(async () => {
  for (const [titulo, archivo] of Object.entries(mapas)) {
    const promo = await prisma.promo.findFirst({ where: { titulo: { contains: titulo, mode: 'insensitive' } } });
    if (promo) {
      const url = archivo ? '/promos/' + encodeURI(archivo) : null;
      await prisma.promo.update({ where: { id: promo.id }, data: { imagen_url: url } });
      console.log('✓', promo.titulo, '->', url || '(sin imagen)');
    } else {
      console.log('✗ No encontrado:', titulo);
    }
  }
  await prisma.$disconnect();
})();
