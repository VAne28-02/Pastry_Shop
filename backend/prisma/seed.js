require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Sembrando base de datos...');

  const roles = ['Administrador', 'Empleado', 'Cliente'];
  const rolesCreados = {};
  for (const nombre of roles) {
    const rol = await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre }
    });
    rolesCreados[nombre] = rol;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('AdminPastel2026*', salt);

  await prisma.usuario.upsert({
    where: { email: 'admin@pasteleria.com' },
    update: {},
    create: {
      email: 'admin@pasteleria.com',
      password_hash: passwordHash,
      rol_id: rolesCreados['Administrador'].id,
      empleado: {
        create: {
          nombre: 'Administrador Central',
          cargo: 'Gerencia'
        }
      }
    }
  });

  // Categorías y productos de ejemplo
  const categoriasData = [
    { nombre: 'Tortas', productos: [
      { nombre: 'Torta de Chocolate', descripcion: 'Torta húmeda de chocolate con cobertura de ganache', precio_base: 45.00, imagen_url: '/img/torta-chocolate.jpg' },
      { nombre: 'Torta de Fresa', descripcion: 'Torta de vainilla con fresas frescas y crema', precio_base: 48.00, imagen_url: '/img/torta-fresa.jpg' },
      { nombre: 'Torta Tres Leches', descripcion: 'Torta esponjosa bañada en tres leches', precio_base: 52.00, imagen_url: '/img/torta-tres-leches.jpg' }
    ]},
    { nombre: 'Pasteles', productos: [
      { nombre: 'Pastel de Manzana', descripcion: 'Pastel de manzana con canela y crumble', precio_base: 28.00, imagen_url: '/img/pastel-manzana.jpg' },
      { nombre: 'Cheesecake', descripcion: 'Cheesecake cremoso con base de galleta', precio_base: 32.00, imagen_url: '/img/cheesecake.jpg' },
      { nombre: 'Pastel de Zanahoria', descripcion: 'Pastel de zanahoria con nueces y frosting', precio_base: 30.00, imagen_url: '/img/pastel-zanahoria.jpg' }
    ]},
    { nombre: 'Bebidas', productos: [
      { nombre: 'Café Americano', descripcion: 'Café americano recién preparado', precio_base: 12.00, imagen_url: '/img/cafe-americano.jpg' },
      { nombre: 'Capuchino', descripcion: 'Capuchino con espuma de leche', precio_base: 15.00, imagen_url: '/img/capuchino.jpg' },
      { nombre: 'Chocolate Caliente', descripcion: 'Chocolate caliente con crema batida', precio_base: 14.00, imagen_url: '/img/chocolate-caliente.jpg' }
    ]}
  ];

  for (const catData of categoriasData) {
    let categoria = await prisma.categoria.findFirst({ where: { nombre: catData.nombre } });
    if (!categoria) {
      categoria = await prisma.categoria.create({ data: { nombre: catData.nombre } });
    }
    for (const prodData of catData.productos) {
      const existe = await prisma.producto.findFirst({ where: { nombre: prodData.nombre } });
      if (!existe) {
        await prisma.producto.create({ data: { ...prodData, categoria_id: categoria.id } });
      }
    }
  }

  // Asignar stock inicial a los productos
  const todosProductos = await prisma.producto.findMany();
  for (const prod of todosProductos) {
    await prisma.producto.update({ where: { id: prod.id }, data: { stock: Math.floor(Math.random() * 20) + 10 } });
  }

  console.log('✅ Base de datos lista.');
}

main()
  .catch((e) => { 
    console.error(e); 
    process.exit(1); 
  })
  .finally(async () => { await prisma.$disconnect(); });