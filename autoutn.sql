-- Crear la base de datos (si no existe)
USE autoutn;

DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS lugares;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
drop table if exists auditoria;


-- Crear tabla de usuarios con legajo como PK
CREATE TABLE usuarios (
  legajo CHAR(5) PRIMARY KEY,  -- ahora es la PK
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  dni INT(8) UNSIGNED NOT NULL UNIQUE,
  tokens TINYINT UNSIGNED CHECK (tokens BETWEEN 0 AND 20),
  contraseña VARCHAR(255) NOT NULL
);

-- Crear tabla de vehículos con patente como PK
CREATE TABLE vehiculos (
  patente VARCHAR(10) PRIMARY KEY,   -- ahora es la PK
  modelo VARCHAR(50) NOT NULL,
  marca VARCHAR(50) NOT NULL,
  color VARCHAR(30),
  anio YEAR NOT NULL,
  legajo_usuario CHAR(5),            -- referencia al usuario dueño
  FOREIGN KEY (legajo_usuario) REFERENCES usuarios(legajo) ON DELETE SET NULL
);

-- Crear tabla de lugares del estacionamiento
CREATE TABLE lugares (
  id_lugar INT AUTO_INCREMENT PRIMARY KEY,
  numero_lugar INT NOT NULL UNIQUE
);

CREATE TABLE reservas (
  id_reserva INT AUTO_INCREMENT PRIMARY KEY,
  legajo_usuario CHAR(5) NOT NULL,
  patente_vehiculo VARCHAR(10) NULL,  -- permite NULL
  id_lugar INT NULL,                  -- permite NULL
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
  legajo_usuario CHAR(5),                -- quién hizo la acción (si aplica)
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP, -- fecha y hora de la acción
  detalle VARCHAR(500)                           -- descripción opcional del cambio
);

--CREACION DE TRIGGERS PARA LA AUDITORIA

DELIMITER $$

-- ==========================
-- TRIGGERS PARA USUARIOS
-- ==========================

DROP TRIGGER IF EXISTS auditoria_usuarios_insert $$
CREATE TRIGGER auditoria_usuarios_insert
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
    VALUES ('lugares', 'INSERT', NEW.id_lugar, CONCAT('Lugar creado: ', NEW.numero_lugar));
END $$

DROP TRIGGER IF EXISTS auditoria_lugares_update $$
CREATE TRIGGER auditoria_lugares_update
AFTER UPDATE ON lugares
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, detalle)
    VALUES ('lugares', 'UPDATE', NEW.id_lugar, CONCAT('Lugar actualizado: ', OLD.numero_lugar, ' -> ', NEW.numero_lugar));
END $$

DROP TRIGGER IF EXISTS auditoria_lugares_delete $$
CREATE TRIGGER auditoria_lugares_delete
AFTER DELETE ON lugares
FOR EACH ROW
BEGIN
    INSERT INTO auditoria(tabla_afectada, accion, clave_primaria, detalle)
    VALUES ('lugares', 'DELETE', OLD.id_lugar, CONCAT('Lugar eliminado: ', OLD.numero_lugar));
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
    IN p_legajo CHAR(5),
    IN p_nombre VARCHAR(50),
    IN p_apellido VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_dni INT,
    IN p_contraseña VARCHAR(255)
)
BEGIN
    INSERT INTO usuarios (legajo, nombre, apellido, email, dni, tokens, contraseña)
    VALUES (p_legajo, p_nombre, p_apellido, p_email, p_dni, 0, p_contraseña);
END $$
DELIMITER ;

-- Actualizar email

DROP PROCEDURE IF EXISTS actualizar_email_usuario;
DELIMITER $$
CREATE PROCEDURE actualizar_email_usuario(
    IN p_legajo CHAR(5),
    IN p_nuevo_email VARCHAR(100)
)
BEGIN
    UPDATE usuarios
    SET email = p_nuevo_email
    WHERE legajo = p_legajo;
END $$
DELIMITER ;

-- Actualizar contraseña

DROP PROCEDURE IF EXISTS actualizar_contraseña_usuario;
DELIMITER $$
CREATE PROCEDURE actualizar_contraseña_usuario(
    IN p_legajo CHAR(5),
    IN p_nueva_contraseña VARCHAR(255)
)
BEGIN
    UPDATE usuarios
    SET contraseña = p_nueva_contraseña
    WHERE legajo = p_legajo;
END $$
DELIMITER ;

-- Elimina usuario y todo lo relacionado a este
DELIMITER $$

DROP PROCEDURE IF EXISTS eliminar_usuario_completo $$
CREATE PROCEDURE eliminar_usuario_completo(IN p_legajo CHAR(5))
BEGIN
    DECLARE v_usuario_count INT;

    -- Verificar si el usuario existe
    SELECT COUNT(*) INTO v_usuario_count
    FROM usuarios
    WHERE legajo = p_legajo;

    IF v_usuario_count = 0 THEN
        -- Lanzar error
        SELECT 'El usuario especificado no existe.' AS error;
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
    IN p_legajo CHAR(5)
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

-- procedimiento para abrir una reserva
DELIMITER $$

DROP PROCEDURE IF EXISTS abrir_reserva $$ 
CREATE PROCEDURE abrir_reserva(
    IN p_legajo CHAR(5),
    IN p_patente VARCHAR(10),
    IN p_id_lugar INT,
    IN p_fecha_entrada DATETIME
)
BEGIN
    INSERT INTO reservas (
        legajo_usuario,
        patente_vehiculo,
        id_lugar,
        fecha_entrada,
        estado
    ) VALUES (
        p_legajo,
        p_patente,
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
    IN p_legajo_usuario CHAR(5)
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

-- ==================================
-- 4️⃣ LUGARES
-- ==================================
DELIMITER $$

-- 1️⃣ Registrar un lugar
DROP PROCEDURE IF EXISTS registrar_lugar $$
CREATE PROCEDURE registrar_lugar(
    IN p_numero_lugar INT
)
BEGIN
    INSERT INTO lugares (numero_lugar)
    VALUES (p_numero_lugar);
END $$


-- 2️⃣ Actualizar un lugar (cambiar el número de lugar)
DROP PROCEDURE IF EXISTS actualizar_lugar $$
CREATE PROCEDURE actualizar_lugar(
    IN p_id_lugar INT,
    IN p_nuevo_numero INT
)
BEGIN
    UPDATE lugares
    SET numero_lugar = p_nuevo_numero
    WHERE id_lugar = p_id_lugar;
END $$


-- 3️⃣ Eliminar un lugar
DROP PROCEDURE IF EXISTS eliminar_lugar $$
CREATE PROCEDURE eliminar_lugar(
    IN p_id_lugar INT
)
BEGIN
    DELETE FROM lugares
    WHERE id_lugar = p_id_lugar;
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