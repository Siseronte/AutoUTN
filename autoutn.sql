-- Crear la base de datos (si no existe)
DROP DATABASE IF EXISTS autoutn;
CREATE DATABASE autoutn;
USE autoutn;

DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS lugares;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS contactos;
DROP TABLE IF EXISTS auditoria;


-- Crear tabla de usuarios con legajo como PK
CREATE TABLE usuarios (
  legajo INT UNSIGNED PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  dni INT UNSIGNED NOT NULL UNIQUE,
  tokens TINYINT UNSIGNED CHECK (tokens BETWEEN 0 AND 20),
  contraseña VARCHAR(255) NOT NULL,
  rol ENUM('general', 'administrador') DEFAULT 'general' NOT NULL
);


-- Crear tabla de vehículos con patente como PK
CREATE TABLE vehiculos (
  patente VARCHAR(10) PRIMARY KEY,   -- ahora es la PK
  modelo VARCHAR(50) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  color VARCHAR(30),
  anio YEAR NOT NULL,
  legajo_usuario INT UNSIGNED,            -- referencia al usuario dueño
  FOREIGN KEY (legajo_usuario) REFERENCES usuarios(legajo) ON DELETE SET NULL
);

-- Crear tabla de lugares del estacionamiento
CREATE TABLE lugares (
  id_lugar INT AUTO_INCREMENT PRIMARY KEY,
  disponible BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  legajo_usuario INT UNSIGNED NOT NULL,
  patente_vehiculo VARCHAR(10) NULL,  -- permite NULL
  id_lugar INT NULL,                  -- permite NULL
  horario TINYINT UNSIGNED NOT NULL CHECK (horario IN (1, 2, 3)), -- 1: Mañana, 2: Tarde, 3: Noche
  fecha_entrada DATETIME NOT NULL,
  fecha_salida DATETIME,
  estado ENUM('activa','finalizada','cancelada') DEFAULT 'activa',
  FOREIGN KEY (legajo_usuario) REFERENCES usuarios(legajo) ON DELETE CASCADE,
  FOREIGN KEY (patente_vehiculo) REFERENCES vehiculos(patente) ON DELETE SET NULL,
  FOREIGN KEY (id_lugar) REFERENCES lugares(id_lugar) ON DELETE SET NULL
);

CREATE TABLE auditoria (
  id_auditoria INT AUTO_INCREMENT PRIMARY KEY,
  tabla_afectada VARCHAR(50) NOT NULL,  -- nombre de la tabla donde ocurrió el cambio
  accion ENUM('INSERT','UPDATE','DELETE') NOT NULL, -- tipo de acción
  clave_primaria VARCHAR(50) NOT NULL,   -- valor de la PK afectada
  legajo_usuario INT UNSIGNED,                -- quién hizo la acción (si aplica)
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP, -- fecha y hora de la acción
  detalle VARCHAR(500)                           -- descripción opcional del cambio
);

-- Crear tabla de contactos (para formulario de contacto)
CREATE TABLE contactos (
  id_contacto INT AUTO_INCREMENT PRIMARY KEY,  -- clave primaria autoincremental
  email VARCHAR(100) NOT NULL,                 -- email del remitente
  mensaje TEXT NOT NULL,                       -- texto del mensaje enviado
  fecha_envio DATETIME DEFAULT CURRENT_TIMESTAMP -- fecha y hora automática
);

--CREACION DE TRIGGERS PARA LA AUDITORIA

DELIMITER $$

-- ==========================
-- TRIGGERS PARA USUARIOS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_usuarios_insert $$
CREATE TRIGGER auditoria_usuarios_insert_y_validacion
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    -- Validar el formato del email antes de insertar
    IF NOT (NEW.email REGEXP '^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Formato de email inválido. Debe ser del dominio UTN (@frh.utn.edu.ar o @alumnos.frh.utn.edu.ar)';
    END IF;
    -- La auditoría se realizará en el trigger AFTER INSERT para asegurar que la inserción fue exitosa.
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_insert_log $$
CREATE TRIGGER auditoria_usuarios_insert_log
AFTER INSERT ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'INSERT', NEW.legajo, NEW.legajo, CONCAT('Usuario creado: ', NEW.nombre, ' ', NEW.apellido));
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_update $$
CREATE TRIGGER auditoria_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'UPDATE', NEW.legajo, NEW.legajo, CONCAT(
        'Antes: ', OLD.nombre, ' ', OLD.apellido, 
        ' | Después: ', NEW.nombre, ' ', NEW.apellido));
END $$

DROP TRIGGER IF EXISTS auditoria_usuarios_delete $$
CREATE TRIGGER auditoria_usuarios_delete
AFTER DELETE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('usuarios', 'DELETE', OLD.legajo, OLD.legajo, CONCAT('Usuario eliminado: ', OLD.nombre, ' ', OLD.apellido));
END $$

-- ==========================
-- TRIGGERS PARA VEHÍCULOS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_vehiculos_insert $$
CREATE TRIGGER auditoria_vehiculos_insert
AFTER INSERT ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'INSERT', NEW.patente, NEW.legajo_usuario, CONCAT('Vehículo creado: ', NEW.marca, ' ', NEW.modelo, ' - ', NEW.patente));
END $$

DROP TRIGGER IF EXISTS auditoria_vehiculos_update $$
CREATE TRIGGER auditoria_vehiculos_update
AFTER UPDATE ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'UPDATE', NEW.patente, NEW.legajo_usuario, CONCAT(
        'Antes: ', OLD.marca, ' ', OLD.modelo, ' | Después: ', NEW.marca, ' ', NEW.modelo));
END $$

DROP TRIGGER IF EXISTS auditoria_vehiculos_delete $$
CREATE TRIGGER auditoria_vehiculos_delete
AFTER DELETE ON vehiculos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('vehiculos', 'DELETE', OLD.patente, OLD.legajo_usuario, CONCAT('Vehículo eliminado: ', OLD.marca, ' ', OLD.modelo, ' - ', OLD.patente));
END $$

-- ==========================
-- TRIGGERS PARA LUGARES
-- ==========================

DROP TRIGGER IF EXISTS auditoria_lugares_insert $$
CREATE TRIGGER auditoria_lugares_insert
AFTER INSERT ON lugares
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, detalle)
    VALUES ('lugares', 'INSERT', NEW.id_lugar, CONCAT('Lugar creado con ID ', NEW.id_lugar));
END $$

DROP TRIGGER IF EXISTS auditoria_lugares_update $$
CREATE TRIGGER auditoria_lugares_update
AFTER UPDATE ON lugares
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, detalle)
    VALUES ('lugares', 'UPDATE', NEW.id_lugar, CONCAT('Lugar actualizado (ID ', NEW.id_lugar, '), disponibilidad: ', NEW.disponible));
END $$

DROP TRIGGER IF EXISTS auditoria_lugares_delete $$
CREATE TRIGGER auditoria_lugares_delete
AFTER DELETE ON lugares
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, detalle)
    VALUES ('lugares', 'DELETE', OLD.id_lugar, CONCAT('Lugar eliminado con ID ', OLD.id_lugar));
END $$


-- ==========================
-- TRIGGERS PARA RESERVAS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_reservas_insert $$
CREATE TRIGGER auditoria_reservas_insert
AFTER INSERT ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'INSERT', NEW.id_reserva, NEW.legajo_usuario, CONCAT('Reserva creada: Vehículo ', NEW.patente_vehiculo, ' en lugar ', NEW.id_lugar, ' desde ', NEW.fecha_entrada));
END $$ 

DROP TRIGGER IF EXISTS auditoria_reservas_update $$
CREATE TRIGGER auditoria_reservas_update
AFTER UPDATE ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'UPDATE', NEW.id_reserva, NEW.legajo_usuario, CONCAT(
        'Reserva actualizada: Vehículo ', OLD.patente_vehiculo, ' en lugar ', OLD.id_lugar, 
        ' | Ahora: Vehículo ', NEW.patente_vehiculo, ' en lugar ', NEW.id_lugar));
END $$

DROP TRIGGER IF EXISTS auditoria_reservas_delete $$
CREATE TRIGGER auditoria_reservas_delete
AFTER DELETE ON reservas
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, legajo_usuario, detalle)
    VALUES ('reservas', 'DELETE', OLD.id_reserva, OLD.legajo_usuario, CONCAT('Reserva eliminada: Vehículo ', OLD.patente_vehiculo, ' en lugar ', OLD.id_lugar));
END $$

DELIMITER ;


--CREACION DE PROCEDIMIENTOS
DELIMITER $$

-- ==========================================
-- 1️⃣ USUARIOS
-- ==========================================

-- Crear usuario
DROP PROCEDURE IF EXISTS registrar_usuario $$
CREATE PROCEDURE registrar_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_dni INT,
    IN p_contraseña VARCHAR(255)
)
BEGIN
    INSERT INTO usuarios (legajo, nombre, apellido, email, dni, tokens, contraseña)
    VALUES (p_legajo, p_nombre, p_apellido, p_email, p_dni, 4, p_contraseña);
END $$
-- Actualizar email
DROP PROCEDURE IF EXISTS actualizar_email_usuario $$
CREATE PROCEDURE actualizar_email_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nuevo_email VARCHAR(100)
)
BEGIN
    UPDATE usuarios
    SET email = p_nuevo_email
    WHERE legajo = p_legajo;
END $$

-- Actualizar contraseña
DROP PROCEDURE IF EXISTS actualizar_contraseña_usuario $$
CREATE PROCEDURE actualizar_contraseña_usuario(
    IN p_legajo INT UNSIGNED,
    IN p_nueva_contraseña VARCHAR(255)
)
BEGIN
    UPDATE usuarios
    SET contraseña = p_nueva_contraseña
    WHERE legajo = p_legajo;
END $$

-- Elimina usuario y todo lo relacionado a este

DROP PROCEDURE IF EXISTS eliminar_usuario_completo $$
CREATE PROCEDURE eliminar_usuario_completo(IN p_legajo INT UNSIGNED)
BEGIN
    DECLARE v_usuario_count INT;

    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO v_usuario_count
    FROM usuarios
    WHERE legajo = p_legajo;

    IF v_usuario_count = 0 THEN
        -- Lanzar error
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El usuario especificado no existe.';
    ELSE
        -- Iniciar transacción
        START TRANSACTION;

        -- Borrar reservas
        DELETE FROM reservas WHERE legajo_usuario = p_legajo;

        -- Borrar vehículos
        DELETE FROM vehiculos WHERE legajo_usuario = p_legajo;

        -- Anonimizar auditoría
        UPDATE auditoria
        SET legajo_usuario = NULL
        WHERE legajo_usuario = p_legajo;

        -- Borrar usuario
        DELETE FROM usuarios WHERE legajo = p_legajo;

        -- Confirmar transacción
        COMMIT;
    END IF;
END $$

DELIMITER ;


-- ==========================================
-- 2️⃣ RESERVAS
-- ==========================================

-- procedimiento para cerrar una reserva
DELIMITER $$

DROP PROCEDURE IF EXISTS finalizar_reserva_usuario $$
CREATE PROCEDURE finalizar_reserva_usuario(
    IN p_legajo INT UNSIGNED
)
BEGIN
    -- Actualizar la única reserva activa del usuario
    UPDATE reservas
    SET fecha_salida = NOW(),
        estado = 'finalizada'
    WHERE legajo_usuario = p_legajo
      AND estado = 'activa';
END $$

DELIMITER ;

DELIMITER $$

-- Procedimiento para finalizar una reserva específica y devolver un token
DROP PROCEDURE IF EXISTS finalizar_reserva_por_id $$
CREATE PROCEDURE finalizar_reserva_por_id(
    IN p_id_reserva INT
)
BEGIN
    DECLARE v_legajo_usuario INT UNSIGNED;

    -- Obtener el legajo del usuario de la reserva que se va a finalizar
    SELECT legajo_usuario INTO v_legajo_usuario FROM reservas WHERE id_reserva = p_id_reserva AND estado = 'activa';

    -- Si se encontró una reserva activa con ese ID
    IF v_legajo_usuario IS NOT NULL THEN
        -- Finalizar la reserva
        UPDATE reservas SET estado = 'finalizada', fecha_salida = NOW() WHERE id_reserva = p_id_reserva;

        -- Ya no se devuelve el token al finalizar la reserva.
        -- UPDATE usuarios SET tokens = LEAST(tokens + 1, 20) WHERE legajo = v_legajo_usuario;
    END IF;
END $$

DELIMITER ;

-- procedimiento para abrir una reserva
DELIMITER $$

DROP PROCEDURE IF EXISTS abrir_reserva $$ 
CREATE PROCEDURE abrir_reserva(
    IN p_legajo INT UNSIGNED,
    IN p_patente VARCHAR(10),
    IN p_id_lugar INT,
    IN p_fecha_entrada DATETIME,
    IN p_horario TINYINT UNSIGNED
)
BEGIN
    INSERT INTO reservas (
        legajo_usuario,
        patente_vehiculo,
        horario,
        id_lugar,
        fecha_entrada,
        estado
    ) VALUES (
        p_legajo,
        p_patente,
        p_horario,
        p_id_lugar,
        p_fecha_entrada,
        'activa'
    );
END $$

DELIMITER ;

-- ==========================================
-- 3️⃣ VEHÍCULOS
-- ==========================================

DELIMITER $$

DROP PROCEDURE IF EXISTS registrar_vehiculo $$
CREATE PROCEDURE registrar_vehiculo(
    IN p_patente VARCHAR(10),
    IN p_modelo VARCHAR(50),
    IN p_marca VARCHAR(50),
    IN p_color VARCHAR(30),
    IN p_anio YEAR,
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    INSERT INTO vehiculos (
        patente,
        modelo,
        marca,
        color,
        anio,
        legajo_usuario
    ) VALUES (
        p_patente,
        p_modelo,
        p_marca,
        p_color,
        p_anio,
        p_legajo_usuario
    );
END $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS eliminar_vehiculo $$
CREATE PROCEDURE eliminar_vehiculo(
    IN p_patente VARCHAR(10)
)
BEGIN
    DELETE FROM vehiculos
    WHERE patente = p_patente;
END $$

DELIMITER ;

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS obtener_vehiculos_por_legajo $$
CREATE PROCEDURE obtener_vehiculos_por_legajo(
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    SELECT patente, modelo, marca, color, anio
    FROM vehiculos
    WHERE legajo_usuario = p_legajo_usuario;
END $$

DELIMITER ;

DELIMITER $$

-- ==================================
-- 4️⃣ LUGARES
-- ==================================

DELIMITER $$
-- 1️⃣ Registrar un lugar (ya no se pasa número)
DROP PROCEDURE IF EXISTS registrar_lugar $$
CREATE PROCEDURE registrar_lugar()
BEGIN
    INSERT INTO lugares (disponible)
    VALUES (TRUE);
END $$

-- 2️⃣ Cambiar disponibilidad (toggle)
DROP PROCEDURE IF EXISTS actualizar_lugar_disponibilidad $$
CREATE PROCEDURE actualizar_lugar_disponibilidad(
    IN p_id_lugar INT
)
BEGIN
    UPDATE lugares
    SET disponible = NOT disponible
    WHERE id_lugar = p_id_lugar;
END $$

-- 3️⃣ Eliminar lugar
DROP PROCEDURE IF EXISTS eliminar_lugar $$
CREATE PROCEDURE eliminar_lugar(
    IN p_id_lugar INT
)
BEGIN
    DELETE FROM lugares
    WHERE id_lugar = p_id_lugar;
END $$

DELIMITER ;

DELIMITER $$

-- Función para verificar si un usuario ya tiene una reserva en una fecha y horario específicos
DROP FUNCTION IF EXISTS usuario_tiene_reserva_en_fecha_y_horario $$
CREATE FUNCTION usuario_tiene_reserva_en_fecha_y_horario(
    p_legajo INT UNSIGNED,
    p_fecha DATE,
    p_horario TINYINT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_reserva_count INT;
    SELECT COUNT(*) INTO v_reserva_count
    FROM reservas
    WHERE legajo_usuario = p_legajo
      AND DATE(fecha_entrada) = p_fecha
      AND horario = p_horario
      AND estado = 'activa';
    
    RETURN IF(v_reserva_count > 0, 1, 0); -- Devuelve 1 si ya tiene reserva, 0 si no
END $$

-- Función para verificar si un usuario ha excedido el límite de reservas activas (límite de 2)
DROP FUNCTION IF EXISTS usuario_excede_limite_reservas_activas $$
CREATE FUNCTION usuario_excede_limite_reservas_activas(
    p_legajo INT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_reservas_activas INT;
    SELECT COUNT(*) INTO v_reservas_activas FROM reservas WHERE legajo_usuario = p_legajo AND estado = 'activa';
    
    RETURN IF(v_reservas_activas >= 2, 1, 0); -- Devuelve 1 si ha alcanzado o excedido el límite, 0 si no
END $$

DELIMITER ;
-- TRIGGER PARA MANEJAR TOKENS

DELIMITER $$

-- ✅ Trigger para usar 1 token cuando se crea una reserva activa
DROP TRIGGER IF EXISTS usar_token_al_reservar $$
CREATE TRIGGER usar_token_al_reservar
BEFORE INSERT ON reservas
FOR EACH ROW
BEGIN
    DECLARE v_tokens_actuales INT;

    -- Buscar tokens del usuario
    SELECT tokens INTO v_tokens_actuales
    FROM usuarios
    WHERE legajo = NEW.legajo_usuario;

    -- Validación 1: ¿El usuario ya tiene una reserva para esta fecha y horario?
    IF usuario_tiene_reserva_en_fecha_y_horario(NEW.legajo_usuario, DATE(NEW.fecha_entrada), NEW.horario) = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ya tienes una reserva para esta fecha y horario.';
    END IF;

    -- Validación 2: ¿El usuario ha excedido el límite de 2 reservas activas?
    IF usuario_excede_limite_reservas_activas(NEW.legajo_usuario) = 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Has alcanzado el límite de 2 reservas activas simultáneas.';
    END IF;

    -- Validación de tokens disponibles
    IF v_tokens_actuales IS NULL OR v_tokens_actuales < 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'No tienes tokens suficientes para realizar una reserva.';
    ELSE
        -- Descontar token
        UPDATE usuarios
        SET tokens = tokens - 1
        WHERE legajo = NEW.legajo_usuario;
    END IF;
END $$

DELIMITER ;

-- ==================================
-- TRIGGERS DE VALIDACIÓN
-- ==================================

DELIMITER $$

-- Trigger para validar email en usuarios
DROP TRIGGER IF EXISTS validar_email_usuarios $$
CREATE TRIGGER validar_email_usuarios
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
    IF NOT (NEW.email REGEXP '^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Formato de email inválido. Debe ser del dominio UTN (@frh.utn.edu.ar o @alumnos.frh.utn.edu.ar)';
    END IF;
END $$

DELIMITER ;

DELIMITER $$

-- ============================================================
-- 1️⃣ Actualizar nombre de un usuario (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_actualizar_nombre $$
CREATE PROCEDURE admin_actualizar_nombre(
    IN p_legajo INT UNSIGNED,
    IN p_nuevo_nombre VARCHAR(50)
)
BEGIN
    UPDATE usuarios
    SET nombre = p_nuevo_nombre
    WHERE legajo = p_legajo;
END $$


-- ============================================================
-- 2️⃣ Actualizar apellido de un usuario (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_actualizar_apellido $$
CREATE PROCEDURE admin_actualizar_apellido(
    IN p_legajo INT UNSIGNED,
    IN p_nuevo_apellido VARCHAR(50)
)
BEGIN
    UPDATE usuarios
    SET apellido = p_nuevo_apellido
    WHERE legajo = p_legajo;
END $$


-- ============================================================
-- 3️⃣ Actualizar tokens de un usuario (solo administrador)
-- ============================================================
DROP PROCEDURE IF EXISTS admin_actualizar_tokens $$
CREATE PROCEDURE admin_actualizar_tokens(
    IN p_legajo INT UNSIGNED,
    IN p_nuevos_tokens TINYINT UNSIGNED
)
BEGIN
    -- Validar que los tokens estén dentro del rango permitido
    IF p_nuevos_tokens > 20 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El valor de tokens debe estar entre 0 y 20.';
    ELSE
        UPDATE usuarios
        SET tokens = p_nuevos_tokens
        WHERE legajo = p_legajo;
    END IF;
END $$

DELIMITER ;

DELIMITER $$

-- ==================================
-- TRIGGERS PARA CONTACTOS
-- ==================================

DROP TRIGGER IF EXISTS auditoria_contactos_insert $$
CREATE TRIGGER auditoria_contactos_insert
AFTER INSERT ON contactos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, clave_primaria, detalle)
    VALUES (
        'contactos',
        'INSERT',
        NEW.id_contacto,
        CONCAT('Nuevo mensaje recibido de ', NEW.email)
    );
END $$

DROP TRIGGER IF EXISTS auditoria_contactos_delete $$
CREATE TRIGGER auditoria_contactos_delete
AFTER DELETE ON contactos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabla_afectada, accion, clave_primaria, detalle)
    VALUES (
        'contactos',
        'DELETE',
        OLD.id_contacto,
        CONCAT('Mensaje eliminado de ', OLD.email)
    );
END $$

DELIMITER ;

DELIMITER $$

DROP PROCEDURE IF EXISTS obtener_reservas_por_legajo $$
CREATE PROCEDURE obtener_reservas_por_legajo(
    IN p_legajo_usuario INT UNSIGNED
)
BEGIN
    SELECT id_reserva, patente_vehiculo, horario, fecha_entrada, estado
    FROM reservas
    WHERE legajo_usuario = p_legajo_usuario
    ORDER BY fecha_entrada DESC;
END $$

DELIMITER ;

DELIMITER $$

-- ==================================
-- PROCEDIMIENTOS PARA CONTACTOS
-- ==================================

-- 1️⃣ Registrar un nuevo mensaje
DROP PROCEDURE IF EXISTS registrar_contacto $$
CREATE PROCEDURE registrar_contacto(
    IN p_email VARCHAR(100),
    IN p_mensaje TEXT
)
BEGIN
    INSERT INTO contactos (email, mensaje)
    VALUES (p_email, p_mensaje);
END $$

-- 3️⃣ Buscar mensajes por email
DROP PROCEDURE IF EXISTS buscar_contactos_por_email $$
CREATE PROCEDURE buscar_contactos_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    SELECT id_contacto, email, mensaje, fecha_envio
    FROM contactos
    WHERE email = p_email
    ORDER BY fecha_envio DESC;
END $$


-- 4️⃣ Eliminar un mensaje por ID
DROP PROCEDURE IF EXISTS eliminar_contacto_por_id $$
CREATE PROCEDURE eliminar_contacto_por_id(
    IN p_id_contacto INT
)
BEGIN
    DELETE FROM contactos
    WHERE id_contacto = p_id_contacto;
END $$

-- 5️⃣ Eliminar un mensaje por email
DROP PROCEDURE IF EXISTS eliminar_contacto_por_email $$
CREATE PROCEDURE eliminar_contacto_por_email(
    IN p_email VARCHAR(100)
)
BEGIN
    DELETE FROM contactos
    WHERE email = p_email;
END $$

DELIMITER ;
-- ==================================
-- ÍNDICES PARA RENDIMIENTO
-- ==================================

-- Índices para búsquedas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_reservas_usuario ON reservas(legajo_usuario);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha ON reservas(fecha_entrada);
CREATE INDEX idx_vehiculos_usuario ON vehiculos(legajo_usuario);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha);
CREATE INDEX idx_contactos_email ON contactos(email);

-- ==================================
-- VISTAS PARA CONSULTAS FRECUENTES
-- ==================================

-- Vista de reservas activas con datos completos
CREATE VIEW vista_reservas_activas AS
SELECT 
    r.id_reserva,
    r.legajo_usuario, 
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    u.email,
    r.patente_vehiculo,
    CONCAT(v.marca, ' ', v.modelo, ' (', v.color, ')') AS vehiculo_info,
    r.id_lugar,
    r.fecha_entrada,
    TIMESTAMPDIFF(HOUR, r.fecha_entrada, NOW()) AS horas_transcurridas
FROM reservas r
JOIN usuarios u ON r.legajo_usuario = u.legajo
LEFT JOIN vehiculos v ON r.patente_vehiculo = v.patente
WHERE r.estado = 'activa';

-- Vista de lugares disponibles
CREATE VIEW vista_lugares_disponibles AS
SELECT 
    l.id_lugar,
    l.disponible,
    CASE 
        WHEN r.id_lugar IS NOT NULL THEN 'Ocupado'
        WHEN l.disponible = FALSE THEN 'No disponible'
        ELSE 'Libre'
    END AS estado_lugar
FROM lugares l
LEFT JOIN reservas r ON l.id_lugar = r.id_lugar AND r.estado = 'activa'
ORDER BY l.id_lugar;

-- Vista de historial de reservas con duración
CREATE VIEW vista_historial_reservas AS
SELECT 
    r.id_reserva,
    r.legajo_usuario,
    CONCAT(u.nombre, ' ', u.apellido) AS nombre_completo,
    r.patente_vehiculo,
    CONCAT(v.marca, ' ', v.modelo) AS vehiculo,
    r.horario,
    r.id_lugar,
    r.fecha_entrada,
    r.fecha_salida,
    r.estado,
    CASE 
        WHEN r.fecha_salida IS NOT NULL 
        THEN TIMESTAMPDIFF(HOUR, r.fecha_entrada, r.fecha_salida)
        ELSE NULL
    END AS duracion_horas
FROM reservas r
JOIN usuarios u ON r.legajo_usuario = u.legajo
LEFT JOIN vehiculos v ON r.patente_vehiculo = v.patente
ORDER BY r.fecha_entrada DESC;
-- ==================================
-- FUNCIONES AUXILIARES
-- ==================================

DELIMITER $$

-- Función para validar formato de email UTN
DROP FUNCTION IF EXISTS validar_email $$
CREATE FUNCTION validar_email(p_email VARCHAR(100))
RETURNS INT
READS SQL DATA
DETERMINISTIC
BEGIN
    IF p_email REGEXP '^[a-z]+[0-9]*@(alumnos\.)?frh\.utn\.edu\.ar$' THEN
        RETURN 1;
    ELSE
        RETURN 0;
    END IF;
END $$



-- procedimiento para calcular cuantos espacios hay disponibles en un determinado momento
DELIMITER $$

DROP FUNCTION IF EXISTS lugares_disponibles_en_fecha_y_horario $$

CREATE FUNCTION lugares_disponibles_en_fecha_y_horario(
    p_fecha DATE, 
    p_horario TINYINT UNSIGNED
)
RETURNS INT
READS SQL DATA
BEGIN
    DECLARE v_total_lugares INT;
    DECLARE v_reservas_ocupadas INT;
    DECLARE v_lugares_libres INT;

    -- Total de lugares en el estacionamiento
    SELECT COUNT(*) INTO v_total_lugares
    FROM lugares;

    -- Cantidad de reservas activas para una fecha y horario específicos
    SELECT COUNT(*) INTO v_reservas_ocupadas
    FROM reservas
    WHERE estado = 'activa'
      AND DATE(fecha_entrada) = p_fecha
      AND horario = p_horario;

    -- Calcular lugares libres
    SET v_lugares_libres = v_total_lugares - v_reservas_ocupadas;

    RETURN v_lugares_libres;
END $$

DELIMITER ;

-- ==================================
-- SEEDING: POBLAR DATOS INICIALES
-- ==================================

DELIMITER $$

-- 1. Creamos un procedimiento temporal para insertar los lugares
DROP PROCEDURE IF EXISTS seed_lugares $$
CREATE PROCEDURE seed_lugares()
BEGIN
    DECLARE i INT DEFAULT 0;
    WHILE i < 3 DO
        CALL registrar_lugar();
        SET i = i + 1;
    END WHILE;
END $$
DELIMITER ;

-- 2. Llamamos al procedimiento para que se ejecute
CALL seed_lugares();

-- 3. (Opcional) Eliminamos el procedimiento para mantener limpia la base de datos
DROP PROCEDURE IF EXISTS seed_lugares;
