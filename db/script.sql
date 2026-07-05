-- =====================================================
-- PROYECTO: QUINIELA MUNDIAL 2026
-- PostgreSQL
-- =====================================================

DROP TABLE IF EXISTS clasificacion_grupo CASCADE;
DROP TABLE IF EXISTS pronosticos CASCADE;
DROP TABLE IF EXISTS grupo_usuarios CASCADE;
DROP TABLE IF EXISTS partidos CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS equipos CASCADE;
DROP TABLE IF EXISTS estadios CASCADE;
DROP TABLE IF EXISTS ciudades CASCADE;
DROP TABLE IF EXISTS fases CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- =====================================================
-- ROLES
-- =====================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(30) UNIQUE NOT NULL
);

INSERT INTO roles(nombre)
VALUES
('ADMIN'),
('USUARIO');

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    email VARCHAR(150) UNIQUE NOT NULL,

    password_hash VARCHAR(255) NOT NULL,

    rol_id INTEGER NOT NULL,

    activo BOOLEAN DEFAULT TRUE,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_rol
        FOREIGN KEY (rol_id)
        REFERENCES roles(id)
);

-- =====================================================
-- CIUDADES
-- =====================================================

CREATE TABLE ciudades (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    pais VARCHAR(100) NOT NULL,

    latitud NUMERIC(10,7),

    longitud NUMERIC(10,7)
);

-- =====================================================
-- ESTADIOS
-- =====================================================

CREATE TABLE estadios (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    capacidad INTEGER,

    ciudad_id INTEGER NOT NULL,

    CONSTRAINT fk_estadio_ciudad
        FOREIGN KEY (ciudad_id)
        REFERENCES ciudades(id)
);
-- =====================================================
-- EQUIPOS
-- =====================================================

CREATE TABLE equipos (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(100) NOT NULL,

    codigo_fifa VARCHAR(10) UNIQUE,

    grupo_mundial VARCHAR(5),

    bandera_url TEXT
);

-- =====================================================
-- FASES DEL MUNDIAL
-- =====================================================

CREATE TABLE fases (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO fases(nombre)
VALUES
('FASE DE GRUPOS'),
('DIECISEISAVOS'),
('OCTAVOS'),
('CUARTOS'),
('SEMIFINAL'),
('TERCER PUESTO'),
('FINAL');

-- =====================================================
-- GRUPOS DE QUINIELA
-- =====================================================

CREATE TABLE grupos (
    id SERIAL PRIMARY KEY,

    nombre VARCHAR(150) NOT NULL,

    codigo_invitacion VARCHAR(20) UNIQUE NOT NULL,

    creador_id INTEGER NOT NULL,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grupo_creador
        FOREIGN KEY (creador_id)
        REFERENCES usuarios(id)
);
-- =====================================================
-- PARTICIPANTES DE GRUPOS
-- =====================================================

CREATE TABLE grupo_usuarios (
    id SERIAL PRIMARY KEY,

    grupo_id INTEGER NOT NULL,

    usuario_id INTEGER NOT NULL,

    fecha_union TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_grupo_usuario_grupo
        FOREIGN KEY (grupo_id)
        REFERENCES grupos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_grupo_usuario_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_grupo_usuario
        UNIQUE(grupo_id, usuario_id)
);

-- =====================================================
-- PARTIDOS
-- =====================================================

CREATE TABLE partidos (
    id SERIAL PRIMARY KEY,

    api_event_id VARCHAR(50) UNIQUE,

    fase_id INTEGER NOT NULL,

    equipo_local_id INTEGER NOT NULL,

    equipo_visitante_id INTEGER NOT NULL,

    estadio_id INTEGER NOT NULL,

    fecha_hora TIMESTAMP NOT NULL,

    goles_local INTEGER,

    goles_visitante INTEGER,

    estado VARCHAR(20) DEFAULT 'PROGRAMADO'
        CHECK (
            estado IN (
                'PROGRAMADO',
                'EN_CURSO',
                'FINALIZADO'
            )
        ),

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_partido_fase
        FOREIGN KEY (fase_id)
        REFERENCES fases(id),

    CONSTRAINT fk_partido_local
        FOREIGN KEY (equipo_local_id)
        REFERENCES equipos(id),

    CONSTRAINT fk_partido_visitante
        FOREIGN KEY (equipo_visitante_id)
        REFERENCES equipos(id),

    CONSTRAINT fk_partido_estadio
        FOREIGN KEY (estadio_id)
        REFERENCES estadios(id)
);

-- =====================================================
-- PRONOSTICOS
-- =====================================================

CREATE TABLE pronosticos (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    partido_id INTEGER NOT NULL,

    goles_local_pronosticado INTEGER NOT NULL
        CHECK(goles_local_pronosticado >= 0),

    goles_visitante_pronosticado INTEGER NOT NULL
        CHECK(goles_visitante_pronosticado >= 0),

    puntos_obtenidos INTEGER DEFAULT 0,

    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pronostico_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_pronostico_partido
        FOREIGN KEY (partido_id)
        REFERENCES partidos(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_pronostico
        UNIQUE(usuario_id, partido_id)
);

-- =====================================================
-- CLASIFICACION DE GRUPOS
-- =====================================================

CREATE TABLE clasificacion_grupo (
    id SERIAL PRIMARY KEY,

    grupo_id INTEGER NOT NULL,

    usuario_id INTEGER NOT NULL,

    puntos_totales INTEGER DEFAULT 0,

    posicion INTEGER,

    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_clasificacion_grupo
        FOREIGN KEY (grupo_id)
        REFERENCES grupos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_clasificacion_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_clasificacion
        UNIQUE(grupo_id, usuario_id)
);

-- =====================================================
-- INDICES
-- =====================================================

CREATE INDEX idx_usuario_email
ON usuarios(email);

CREATE INDEX idx_partidos_fecha
ON partidos(fecha_hora);

CREATE INDEX idx_partidos_estado
ON partidos(estado);

CREATE INDEX idx_pronosticos_usuario
ON pronosticos(usuario_id);

CREATE INDEX idx_pronosticos_partido
ON pronosticos(partido_id);

CREATE INDEX idx_grupo_usuario_usuario
ON grupo_usuarios(usuario_id);

CREATE INDEX idx_grupo_usuario_grupo
ON grupo_usuarios(grupo_id);

CREATE INDEX idx_clasificacion_grupo
ON clasificacion_grupo(grupo_id);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO usuarios (
    nombre,
    email,
    password_hash,
    rol_id
)
VALUES (
    'Administrador',
    'admin@quiniela.com',
    '$2a$10$hash_temporal',
    1
);

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================