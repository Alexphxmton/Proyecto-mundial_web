const db = require('../config/db');

/**
 * Calcula los puntos obtenidos en base al pronóstico y el resultado real.
 */
const calculatePoints = (p_local, p_visitor, r_local, r_visitor) => {
  // Score exacto -> 3 puntos
  if (p_local === r_local && p_visitor === r_visitor) {
    return 3;
  }

  // Acierto al ganador (Local)
  if (r_local > r_visitor && p_local > p_visitor) {
    return 1;
  }

  // Acierto al ganador (Visitante)
  if (r_local < r_visitor && p_local < p_visitor) {
    return 1;
  }

  // Acierto al empate
  if (r_local === r_visitor && p_local === p_visitor) {
    return 1;
  }

  return 0;
};

/**
 * Actualiza los puntos de todos los pronósticos para un partido y recalcula las clasificaciones de los grupos.
 */
const updatePredictionsAndRankings = async (partidoId, golesLocal, golesVisitante) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener todos los pronósticos de este partido
    const predictionsRes = await client.query(
      'SELECT id, usuario_id, goles_local_pronosticado, goles_visitante_pronosticado FROM pronosticos WHERE partido_id = $1',
      [partidoId]
    );

    // 2. Calcular y actualizar puntos para cada pronóstico
    for (const pred of predictionsRes.rows) {
      const puntos = calculatePoints(
        pred.goles_local_pronosticado,
        pred.goles_visitante_pronosticado,
        golesLocal,
        golesVisitante
      );

      await client.query(
        'UPDATE pronosticos SET puntos_obtenidos = $1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = $2',
        [puntos, pred.id]
      );
    }

    // 3. Obtener todos los grupos en el sistema
    const gruposRes = await client.query('SELECT id FROM grupos');
    const grupos = gruposRes.rows;

    for (const grupo of grupos) {
      // Obtener todos los miembros del grupo
      const miembrosRes = await client.query(
        'SELECT usuario_id FROM grupo_usuarios WHERE grupo_id = $1',
        [grupo.id]
      );
      const miembros = miembrosRes.rows;

      const miembrosPuntos = [];

      for (const miembro of miembros) {
        // Calcular puntos totales del usuario
        // Sumamos los puntos_obtenidos de todos sus pronósticos
        const puntosRes = await client.query(
          'SELECT COALESCE(SUM(puntos_obtenidos), 0) as total_puntos FROM pronosticos WHERE usuario_id = $1',
          [miembro.usuario_id]
        );
        const puntosTotales = parseInt(puntosRes.rows[0].total_puntos);

        miembrosPuntos.push({
          usuario_id: miembro.usuario_id,
          puntos_totales: puntosTotales,
        });
      }

      // Ordenar por puntos desc
      miembrosPuntos.sort((a, b) => b.puntos_totales - a.puntos_totales);

      // Guardar o actualizar la clasificación del grupo
      let posicion = 1;
      for (let i = 0; i < miembrosPuntos.length; i++) {
        const item = miembrosPuntos[i];
        
        // Manejo de empates en la posición
        if (i > 0 && item.puntos_totales < miembrosPuntos[i - 1].puntos_totales) {
          posicion = i + 1;
        }

        // Upsert en clasificacion_grupo
        await client.query(
          `INSERT INTO clasificacion_grupo (grupo_id, usuario_id, puntos_totales, posicion, fecha_actualizacion)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           ON CONFLICT (grupo_id, usuario_id)
           DO UPDATE SET puntos_totales = EXCLUDED.puntos_totales, posicion = EXCLUDED.posicion, fecha_actualizacion = CURRENT_TIMESTAMP`,
          [grupo.id, item.usuario_id, item.puntos_totales, posicion]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`Puntos y clasificaciones actualizados exitosamente para el partido ID: ${partidoId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en updatePredictionsAndRankings:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  calculatePoints,
  updatePredictionsAndRankings,
};
