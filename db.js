require('dotenv').config();
const fs = require('fs');
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: {
    // Para desarrollo local sin verificar certificado:
    rejectUnauthorized: false

    // Para producción con certificados válidos:
    // ca: fs.readFileSync('/ruta/al/ca.pem'),
    // key: fs.readFileSync('/ruta/al/client-key.pem'),
    // cert: fs.readFileSync('/ruta/al/client-cert.pem')
  }
});

module.exports = db;

