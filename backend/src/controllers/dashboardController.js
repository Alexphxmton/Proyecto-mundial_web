const db = require('../config/db');

const getSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Cantidad de grupos a los que pertenece
    const groupsCountRes = await db.query(
      'SELECT COUNT(*)::integer as count FROM grupo_usuarios WHERE usuario_id = $1',
      [userId]
    );
    const cantidadGrupos = groupsCountRes.rows[0].count;

    // 2. Próximos partidos pendientes de pronóstico
    const pendingMatchesRes = await db.query(
      `SELECT p.id, p.fecha_hora,
              el.nombre as local_nombre, el.bandera_url as local_bandera, el.codigo_fifa as local_codigo,
              ev.nombre as visitante_nombre, ev.bandera_url as visitante_bandera, ev.codigo_fifa as visitante_codigo,
              f.nombre as fase_nombre, est.nombre as estadio_nombre, c.nombre as ciudad_nombre
       FROM partidos p
       JOIN equipos el ON p.equipo_local_id = el.id
       JOIN equipos ev ON p.equipo_visitante_id = ev.id
       JOIN fases f ON p.fase_id = f.id
       JOIN estadios est ON p.estadio_id = est.id
       JOIN ciudades c ON est.ciudad_id = c.id
       LEFT JOIN pronosticos pr ON p.id = pr.partido_id AND pr.usuario_id = $1
       WHERE p.estado = 'PROGRAMADO'
         AND p.fecha_hora > CURRENT_TIMESTAMP
         AND pr.id IS NULL
       ORDER BY p.fecha_hora ASC
       LIMIT 5`,
      [userId]
    );
    const proximosPendientes = pendingMatchesRes.rows;

    // 3. Posición en cada grupo y puntaje acumulado en cada uno
    const positionsRes = await db.query(
      `SELECT g.id as grupo_id, g.nombre as grupo_nombre, g.codigo_invitacion,
              cg.posicion, cg.puntos_totales,
              (SELECT COUNT(*) FROM grupo_usuarios gu WHERE gu.grupo_id = g.id) as total_miembros
       FROM clasificacion_grupo cg
       JOIN grupos g ON cg.grupo_id = g.id
       WHERE cg.usuario_id = $1
       ORDER BY g.nombre ASC`,
      [userId]
    );
    const posicionesGrupos = positionsRes.rows;

    // 4. Puntaje acumulado total
    const totalPointsRes = await db.query(
      'SELECT COALESCE(SUM(puntos_obtenidos), 0)::integer as total FROM pronosticos WHERE usuario_id = $1',
      [userId]
    );
    const puntajeAcumulado = totalPointsRes.rows[0].total;

    res.json({
      cantidadGrupos,
      proximosPendientes,
      posicionesGrupos,
      puntajeAcumulado,
    });
  } catch (error) {
    console.error('Error al obtener el resumen del dashboard:', error);
    res.status(500).json({ error: 'Error al obtener el resumen del dashboard' });
  }
};

module.exports = {
  getSummary,
};
