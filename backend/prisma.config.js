const { defineConfig } = require('@prisma/config');
require('dotenv').config();

module.exports = defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // Le indicamos a Prisma 7 cómo debe ejecutar nuestro archivo seed en Node.js
    seed: 'node ./prisma/seed.js',
  }
});