const db = require('../config/db');

const getMatches = async (req, res) => {
  const { fase_id, estado, fecha } = req.query;

  let query = `
    SELECT p.id, p.api_event_id, p.fecha_hora, p.goles_local, p.goles_visitante, p.estado,
           f.nombre as fase_nombre, f.id as fase_id,
           el.nombre as local_nombre, el.codigo_fifa as local_codigo, el.bandera_url as local_bandera,
           ev.nombre as visitante_nombre, ev.codigo_fifa as visitante_codigo, ev.bandera_url as visitante_bandera,
           est.nombre as estadio_nombre,
           c.nombre as ciudad_nombre, c.pais as ciudad_pais, c.latitud, c.longitud
    FROM partidos p
    JOIN fases f ON p.fase_id = f.id
    JOIN equipos el ON p.equipo_local_id = el.id
    JOIN equipos ev ON p.equipo_visitante_id = ev.id
    JOIN estadios est ON p.estadio_id = est.id
    JOIN ciudades c ON est.ciudad_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (fase_id) {
    params.push(parseInt(fase_id));
    query += ` AND p.fase_id = $${params.length}`;
  }

  if (estado) {
    params.push(estado);
    query += ` AND p.estado = $${params.length}`;
  }

  if (fecha) {
    params.push(fecha); // Espera formato 'YYYY-MM-DD'
    query += ` AND p.fecha_hora::date = $${params.length}`;
  }

  query += ` ORDER BY p.fecha_hora ASC`;

  try {
    const matchesRes = await db.query(query, params);
    
    // Si el usuario está autenticado, podemos incluir también su pronóstico en la respuesta
    // Esto es muy útil en el frontend para mostrar lo que pronosticó y cuántos puntos ganó
    const userId = req.user ? req.user.id : null;
    let matches = matchesRes.rows;

    if (userId) {
      const predictionsRes = await db.query(
        'SELECT partido_id, goles_local_pronosticado, goles_visitante_pronosticado, puntos_obtenidos FROM pronosticos WHERE usuario_id = $1',
        [userId]
      );
      
      const predMap = {};
      predictionsRes.rows.forEach(p => {
        predMap[p.partido_id] = p;
      });

      matches = matches.map(m => ({
        ...m,
        pronostico: predMap[m.id] || null
      }));
    }

    res.json(matches);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error al obtener el calendario de partidos' });
  }
};

const getMatchDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    const matchRes = await db.query(
      `SELECT p.id, p.api_event_id, p.fecha_hora, p.goles_local, p.goles_visitante, p.estado,
              f.nombre as fase_nombre, f.id as fase_id,
              el.nombre as local_nombre, el.codigo_fifa as local_codigo, el.bandera_url as local_bandera,
              ev.nombre as visitante_nombre, ev.codigo_fifa as visitante_codigo, ev.bandera_url as visitante_bandera,
              est.nombre as estadio_nombre, est.capacidad as estadio_capacidad,
              c.nombre as ciudad_nombre, c.pais as ciudad_pais, c.latitud, c.longitud
       FROM partidos p
       JOIN fases f ON p.fase_id = f.id
       JOIN equipos el ON p.equipo_local_id = el.id
       JOIN equipos ev ON p.equipo_visitante_id = ev.id
       JOIN estadios est ON p.estadio_id = est.id
       JOIN ciudades c ON est.ciudad_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const match = matchRes.rows[0];

    // Incluir pronóstico si existe
    if (userId) {
      const predRes = await db.query(
        `SELECT goles_local_pronosticado, goles_visitante_pronosticado, puntos_obtenidos 
         FROM pronosticos 
         WHERE usuario_id = $1 AND partido_id = $2`,
        [userId, id]
      );
      match.pronostico = predRes.rows.length > 0 ? predRes.rows[0] : null;
    }

    res.json(match);
  } catch (error) {
    console.error('Error al obtener detalle del partido:', error);
    res.status(500).json({ error: 'Error al obtener el detalle del partido' });
  }
};

const getSedes = async (req, res) => {
  try {
    const sedesRes = await db.query(
      `SELECT c.id, c.nombre, c.pais, c.latitud, c.longitud,
              (SELECT json_agg(json_build_object('id', est.id, 'nombre', est.nombre, 'capacidad', est.capacidad))
               FROM estadios est WHERE est.ciudad_id = c.id) as estadios
       FROM ciudades c
       ORDER BY c.nombre ASC`
    );
    res.json(sedesRes.rows);
  } catch (error) {
    console.error('Error al obtener sedes:', error);
    res.status(500).json({ error: 'Error al obtener las sedes oficiales' });
  }
};

const getFases = async (req, res) => {
  try {
    const fasesRes = await db.query('SELECT id, nombre FROM fases ORDER BY id ASC');
    res.json(fasesRes.rows);
  } catch (error) {
    console.error('Error al obtener fases:', error);
    res.status(500).json({ error: 'Error al obtener las fases del mundial' });
  }
};

const getEquipos = async (req, res) => {
  try {
    const equiposRes = await db.query('SELECT id, nombre, codigo_fifa, grupo_mundial, bandera_url FROM equipos ORDER BY nombre ASC');
    res.json(equiposRes.rows);
  } catch (error) {
    console.error('Error al obtener equipos:', error);
    res.status(500).json({ error: 'Error al obtener los equipos' });
  }
};

module.exports = {
  getMatches,
  getMatchDetail,
  getSedes,
  getFases,
  getEquipos,
};
