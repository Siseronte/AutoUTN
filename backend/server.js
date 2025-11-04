// c:/Users/User/Desktop/Proyecto Final Integrador/backend/server.js

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path'); // 1. Importa el módulo 'path' de Node.js

// 2. Configura dotenv para que encuentre el archivo .env en la carpeta actual del backend
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const port = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// --- Endpoint de Registro ---
app.post('/api/registro', async (req, res) => {
    const { legajo, nombre, apellido, email, dni, password } = req.body;

    if (!legajo || !nombre || !apellido || !email || !dni || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL registrar_usuario(?, ?, ?, ?, ?, ?)', // Llamada con 6 parámetros
            [legajo, nombre, apellido, email, dni, hashedPassword] // Se envían 6 argumentos
        );
        await connection.end();

        res.status(201).json({ message: 'Usuario registrado con éxito.' });

    } catch (error) {
        console.error('Error en el registro:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'El email o legajo ya está en uso.' });
        }
        res.status(500).json({ message: 'Error interno del servidor. Revisa la consola del backend.' });
    }
});

// --- Endpoint de Login ---
app.post('/api/login', async (req, res) => {
    const { legajo, password } = req.body;

    if (!legajo || !password) {
        return res.status(400).json({ message: 'Legajo y contraseña son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM usuarios WHERE legajo = ?', [legajo]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' }); // Usamos un mensaje genérico por seguridad
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.contraseña);

        if (match) {
            // ¡Login exitoso!
            // Por ahora, solo enviamos los datos del usuario. Más adelante aquí se generaría un Token (JWT).
            const userData = {
                legajo: user.legajo,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                tokens: user.tokens
            };
            res.status(200).json({ message: 'Login exitoso', user: userData });
        } else {
            res.status(401).json({ message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER datos de un usuario por legajo ---
app.get('/api/usuarios/:legajo', async (req, res) => {
    const { legajo } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajo]);
        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};


// --- Endpoint para verificar disponibilidad ---
app.get('/api/disponibilidad', async (req, res) => {
    const { fecha, horario } = req.query; // Recibimos fecha y horario, ej: /api/disponibilidad?fecha=2025-10-27&horario=1

    if (!fecha || !horario) {
        return res.status(400).json({ message: 'Se requiere una fecha y un horario.' });
    }

    // Validar que la fecha sea un formato válido (simplificado)
    if (isNaN(new Date(fecha).getTime())) {
        return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        // Llamamos a la nueva función SQL
        const [rows] = await connection.execute('SELECT lugares_disponibles_en_fecha_y_horario(?, ?) AS disponibles', [fecha, horario]);
        await connection.end();

        const disponibles = rows[0].disponibles;
        res.status(200).json({ disponibles: disponibles });

    } catch (error) {
        console.error('Error al verificar disponibilidad:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para crear una reserva ---
app.post('/api/reservas', async (req, res) => {
    // NOTA: En un futuro, aquí deberíamos verificar que el usuario esté autenticado (con JWT, por ejemplo)
    const { legajo, patente, fecha, horario } = req.body;

    if (!legajo || !patente || !fecha || !horario) {
        return res.status(400).json({ message: 'Legajo, patente, fecha y horario son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // 1. Volvemos a verificar la disponibilidad como medida de seguridad, por si justo alguien reservó.
        const [rows] = await connection.execute('SELECT lugares_disponibles_en_fecha_y_horario(?, ?) AS disponibles', [new Date(fecha).toISOString().slice(0, 10), horario]);
        if (rows[0].disponibles <= 0) {
            await connection.end();
            return res.status(409).json({ message: 'Lo sentimos, ya no hay lugares disponibles para ese horario.' }); // 409 Conflict
        }

        // 2. Si hay lugar, llamamos al procedimiento para abrir la reserva.
        // Usamos una transacción para asegurar que la reserva y la consulta de usuario sean atómicas.
        await connection.beginTransaction();
        await connection.execute('CALL abrir_reserva(?, ?, ?, ?, ?)', [legajo, patente, null, fecha, horario]);
        
        // 3. Obtenemos los datos actualizados del usuario (con los tokens descontados por el trigger).
        const [userRows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajo]);
        
        await connection.commit(); // Confirmamos la transacción
        await connection.end();

        // 4. Enviamos el mensaje de éxito Y los datos actualizados del usuario.
        res.status(201).json({ message: 'Reserva creada con éxito.', user: userRows[0] });

    } catch (error) {
        console.error('Error al crear la reserva:', error);
        // Si es un error de validación lanzado desde un trigger (SQLSTATE 45000), enviamos el mensaje específico del trigger al frontend.
        if (error.sqlState === '45000') {
            // Usamos un código de estado 409 (Conflicto), que es apropiado para estas validaciones.
            return res.status(409).json({ message: error.sqlMessage });
        }
        // Para cualquier otro tipo de error, enviamos un mensaje genérico.
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para OBTENER las reservas de un usuario ---
app.get('/api/reservas', async (req, res) => {
    const { legajo } = req.query;

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [reservas] = await connection.execute('CALL obtener_reservas_por_legajo(?)', [legajo]);
        await connection.end();
        res.status(200).json(reservas[0]);
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para FINALIZAR una reserva ---
app.put('/api/reservas/:id/finalizar', async (req, res) => {
    const { id } = req.params; // Obtenemos el ID de la reserva desde la URL

    if (!id) {
        return res.status(400).json({ message: 'Se requiere el ID de la reserva.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // Para devolver los datos del usuario, primero necesitamos saber a quién pertenece la reserva.
        // Usamos una transacción para asegurar la integridad de los datos.
        await connection.beginTransaction();
        const [reservaRows] = await connection.execute('SELECT legajo_usuario FROM reservas WHERE id_reserva = ?', [id]);
        
        if (reservaRows.length === 0) {
            await connection.rollback();
            await connection.end();
            return res.status(404).json({ message: 'Reserva no encontrada.' });
        }
        const legajoUsuario = reservaRows[0].legajo_usuario;

        // Llamamos al nuevo procedimiento que finaliza la reserva y devuelve el token
        await connection.execute('CALL finalizar_reserva_por_id(?)', [id]);
        const [userRows] = await connection.execute('SELECT legajo, nombre, apellido, email, rol, tokens FROM usuarios WHERE legajo = ?', [legajoUsuario]);
        await connection.commit();
        await connection.end();

        res.status(200).json({ message: 'Reserva finalizada con éxito.', user: userRows[0] });
    } catch (error) {
        console.error('Error al finalizar la reserva:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// ==========================================
// 🚗 ENDPOINTS DE VEHÍCULOS
// ==========================================

// --- Endpoint para OBTENER los vehículos de un usuario ---
app.get('/api/vehiculos', async (req, res) => {
    const { legajo } = req.query; // Recibimos el legajo por query params: /api/vehiculos?legajo=12345

    if (!legajo) {
        return res.status(400).json({ message: 'Se requiere el legajo del usuario.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [vehiculos] = await connection.execute('CALL obtener_vehiculos_por_legajo(?)', [legajo]);
        await connection.end();
        res.status(200).json(vehiculos[0]); // El resultado del SP está en el primer elemento del array
    } catch (error) {
        console.error('Error al obtener vehículos:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para REGISTRAR un nuevo vehículo ---
app.post('/api/vehiculos', async (req, res) => {
    const { patente, modelo, marca, color, anio, legajo_usuario } = req.body;

    if (!patente || !modelo || !marca || !anio || !legajo_usuario) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'CALL registrar_vehiculo(?, ?, ?, ?, ?, ?)',
            [patente, modelo, marca, color, anio, legajo_usuario]
        );
        await connection.end();
        res.status(201).json({ message: 'Vehículo registrado con éxito.' });
    } catch (error) {
        console.error('Error al registrar vehículo:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'La patente ingresada ya está registrada.' });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// --- Endpoint para ELIMINAR un vehículo ---
app.delete('/api/vehiculos/:patente', async (req, res) => {
    const { patente } = req.params; // La patente viene en la URL: /api/vehiculos/ABC123

    if (!patente) {
        return res.status(400).json({ message: 'Se requiere la patente del vehículo.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL eliminar_vehiculo(?)', [patente]);
        await connection.end();
        res.status(200).json({ message: 'Vehículo eliminado con éxito.' });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// ==========================================
// ✉️ ENDPOINT DE CONTACTO
// ==========================================

app.post('/api/contacto', async (req, res) => {
    const { email, mensaje } = req.body;

    if (!email || !mensaje) {
        return res.status(400).json({ message: 'El email y el mensaje son obligatorios.' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute('CALL registrar_contacto(?, ?)', [email, mensaje]);
        await connection.end();
        res.status(201).json({ message: 'Mensaje enviado con éxito. Gracias por contactarnos.' });
    } catch (error) {
        console.error('Error al registrar contacto:', error);
        // Manejar el error de formato de email del trigger
        if (error.sqlState === '45000') {
            return res.status(400).json({ message: error.sqlMessage });
        }
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Backend corriendo en http://localhost:${port}`);
});
