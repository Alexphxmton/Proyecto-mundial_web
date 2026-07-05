const db = require('../config/db');

const savePrediction = async (req, res) => {
  const { partido_id, goles_local_pronosticado, goles_visitante_pronosticado } = req.body;
  const userId = req.user.id;

  if (partido_id === undefined || goles_local_pronosticado === undefined || goles_visitante_pronosticado === undefined) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const gLocal = parseInt(goles_local_pronosticado);
  const gVisitante = parseInt(goles_visitante_pronosticado);

  if (isNaN(gLocal) || gLocal < 0 || isNaN(gVisitante) || gVisitante < 0) {
    return res.status(400).json({ error: 'Los goles pronosticados deben ser números enteros mayores o iguales a 0' });
  }

  try {
    // 1. Obtener la fecha e inicio del partido
    const matchRes = await db.query(
      'SELECT fecha_hora, estado FROM partidos WHERE id = $1',
      [partido_id]
    );

    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const partido = matchRes.rows[0];

    // 2. Verificar que el partido no haya empezado
    const matchTime = new Date(partido.fecha_hora);
    const now = new Date();

    if (matchTime <= now || partido.estado !== 'PROGRAMADO') {
      return res.status(400).json({ 
        error: 'No se puede registrar o modificar el pronóstico. El partido ya ha comenzado o finalizado.' 
      });
    }

    // 3. Insertar o actualizar pronóstico (Upsert)
    const predictionRes = await db.query(
      `INSERT INTO pronosticos (usuario_id, partido_id, goles_local_pronosticado, goles_visitante_pronosticado)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, partido_id)
       DO UPDATE SET 
         goles_local_pronosticado = EXCLUDED.goles_local_pronosticado,
         goles_visitante_pronosticado = EXCLUDED.goles_visitante_pronosticado,
         fecha_actualizacion = CURRENT_TIMESTAMP
       RETURNING id, usuario_id, partido_id, goles_local_pronosticado, goles_visitante_pronosticado`,
      [userId, partido_id, gLocal, gVisitante]
    );

    res.status(200).json({
      message: 'Pronóstico guardado exitosamente',
      prediction: predictionRes.rows[0]
    });
  } catch (error) {
    console.error('Error al guardar pronóstico:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

const getUserPredictions = async (req, res) => {
  const userId = req.user.id;

  try {
    const predictionsRes = await db.query(
      `SELECT p.id as prediction_id, p.goles_local_pronosticado, p.goles_visitante_pronosticado, p.puntos_obtenidos, p.fecha_creacion,
              m.id as partido_id, m.fecha_hora, m.goles_local, m.goles_visitante, m.estado,
              el.nombre as local_nombre, el.bandera_url as local_bandera, el.codigo_fifa as local_codigo,
              ev.nombre as visitante_nombre, ev.bandera_url as visitante_bandera, ev.codigo_fifa as visitante_codigo,
              f.nombre as fase_nombre
       FROM pronosticos p
       JOIN partidos m ON p.partido_id = m.id
       JOIN equipos el ON m.equipo_local_id = el.id
       JOIN equipos ev ON m.equipo_visitante_id = ev.id
       JOIN fases f ON m.fase_id = f.id
       WHERE p.usuario_id = $1
       ORDER BY m.fecha_hora ASC`,
      [userId]
    );

    res.json(predictionsRes.rows);
  } catch (error) {
    console.error('Error al obtener pronósticos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener los pronósticos' });
  }
};

module.exports = {
  savePrediction,
  getUserPredictions,
};
