-- =====================================================
-- SEED DATA FOR QUINIELA MUNDIAL 2026
-- =====================================================

-- 1. CIUDADES
INSERT INTO ciudades (nombre, pais, latitud, longitud) VALUES
('Miami', 'Estados Unidos', 25.761680, -80.191790),
('Seattle', 'Estados Unidos', 47.606210, -122.332071),
('Los Angeles', 'Estados Unidos', 34.052234, -118.243685),
('San Francisco', 'Estados Unidos', 37.774929, -122.419416),
('Atlanta', 'Estados Unidos', 33.748995, -84.387982),
('Houston', 'Estados Unidos', 29.760427, -95.369803),
('Dallas', 'Estados Unidos', 32.776664, -96.796988),
('Kansas City', 'Estados Unidos', 39.099727, -94.578567),
('Philadelphia', 'Estados Unidos', 39.952584, -75.165222),
('Boston', 'Estados Unidos', 42.360082, -71.058880),
('New York/New Jersey', 'Estados Unidos', 40.712776, -74.005973),
('Mexico City', 'Mexico', 19.432608, -99.133208),
('Guadalajara', 'Mexico', 20.659698, -103.349609),
('Monterrey', 'Mexico', 25.686614, -100.316113),
('Toronto', 'Canada', 43.653226, -79.383184),
('Vancouver', 'Canada', 49.282729, -123.120738);

-- 2. ESTADIOS
INSERT INTO estadios (nombre, capacidad, ciudad_id) VALUES
('Hard Rock Stadium', 64767, 1),
('Lumen Field', 69000, 2),
('SoFi Stadium', 70240, 3),
('Levi Stadium', 68500, 4),
('Mercedes-Benz Stadium', 71000, 5),
('NRG Stadium', 72220, 6),
('AT&T Stadium', 80000, 7),
('Arrowhead Stadium', 76416, 8),
('Lincoln Financial Field', 69796, 9),
('Gillette Stadium', 65878, 10),
('MetLife Stadium', 82500, 11),
('Estadio Azteca', 87523, 12),
('Estadio Akron', 48070, 13),
('Estadio BBVA', 53500, 14),
('BMO Field', 30000, 15),
('BC Place', 54500, 16);

-- 3. EQUIPOS
INSERT INTO equipos (nombre, codigo_fifa, grupo_mundial, bandera_url) VALUES
('Argentina', 'ARG', 'A', 'https://flagcdn.com/w320/ar.png'),
('Francia', 'FRA', 'A', 'https://flagcdn.com/w320/fr.png'),
('Brasil', 'BRA', 'A', 'https://flagcdn.com/w320/br.png'),
('Inglaterra', 'ENG', 'A', 'https://flagcdn.com/w320/gb-eng.png'),
('España', 'ESP', 'B', 'https://flagcdn.com/w320/es.png'),
('Alemania', 'GER', 'B', 'https://flagcdn.com/w320/de.png'),
('Estados Unidos', 'USA', 'B', 'https://flagcdn.com/w320/us.png'),
('México', 'MEX', 'B', 'https://flagcdn.com/w320/mx.png'),
('Canadá', 'CAN', 'C', 'https://flagcdn.com/w320/ca.png'),
('Portugal', 'POR', 'C', 'https://flagcdn.com/w320/pt.png'),
('Italia', 'ITA', 'C', 'https://flagcdn.com/w320/it.png'),
('Países Bajos', 'NED', 'C', 'https://flagcdn.com/w320/nl.png'),
('Uruguay', 'URU', 'D', 'https://flagcdn.com/w320/uy.png'),
('Colombia', 'COL', 'D', 'https://flagcdn.com/w320/co.png'),
('Japón', 'JPN', 'D', 'https://flagcdn.com/w320/jp.png'),
('Marruecos', 'MAR', 'D', 'https://flagcdn.com/w320/ma.png');
