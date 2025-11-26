const express = require("express");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const db = require('./db.js');
const bcrypt = require('bcrypt');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;


// Middleware para parsear JSON (datos del ESP32)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Página principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "registro.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/analisis", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "analisis.html"));
});

// APIS

// api para obtener usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, nombre, email, created_at FROM user_data');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// api para obtener sensores
app.get('/api/sensores', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT lat, lon, alt, speed, sats, bpm, spo2, temp, created_at FROM sensor_data');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los sensores' });
  }
});

// api para registrar usuario
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario en la base de datos usando await directamente
        const sql = 'INSERT INTO user_data (nombre, email, password, created_at) VALUES (?, ?, ?, NOW())';
        await db.query(sql, [username, email, hashedPassword]);

        // Responder JSON
        res.status(200).json({ message: 'Usuario registrado correctamente' });

    } catch (err) {
        console.error(err);

        // Si es error por duplicado de email
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        res.status(500).json({ message: 'Error al registrar usuario' });
    }
});

// api para iniciar sesion
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.send('Email y contraseña son obligatorios');

    try {
        const [results] = await db.query('SELECT * FROM user_data WHERE email = ?', [email]);
        if (results.length === 0) return res.send('Usuario no encontrado');

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send('Contraseña incorrecta');

        // login exitoso
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.send('Error en el servidor');
    }
});

// api para recibir datos de los sensores
app.post("/api/sensor", async (req, res) => {
  const { lat, lon, alt, speed, sats, bpm, spo2, temp } = req.body;

  io.emit("nuevos_datos", {
    temperatura: temp,
    pulso: bpm,
    gps: { lat, lng: lon, alt },
    speed,
    sats,
    spo2
  });

    try {
  const [result] = await db.query(
    `INSERT INTO sensor_data (lat, lon, alt, speed, sats, bpm, spo2, temp, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [lat, lon, alt, speed, sats, bpm, spo2, temp]
  );

  res.json({ status: "ok", insertedId: result.insertId });

} catch (err) {
  console.error(err);
  res.status(500).json({ error: "Error al guardar en la base de datos" });
}

});

/* server.listen(PORT,'26.143.35.32',() => {
  console.log(`Servidor corriendo en http://26.143.35.32:${PORT}`);
}); */

/* server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); */

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

