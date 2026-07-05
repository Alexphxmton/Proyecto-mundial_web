const db = require('../config/db');
const syncService = require('../services/syncService');

const createMatch = async (req, res) => {
  const { api_event_id, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora } = req.body;

  if (!fase_id || !equipo_local_id || !equipo_visitante_id || !estadio_id || !fecha_hora) {
    return res.status(400).json({ error: 'Todos los campos excepto API Event ID son obligatorios' });
  }

  if (equipo_local_id === equipo_visitante_id) {
    return res.status(400).json({ error: 'El equipo local y el visitante no pueden ser el mismo' });
  }

  try {
    const newMatch = await db.query(
      `INSERT INTO partidos (api_event_id, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'PROGRAMADO')
       RETURNING id, api_event_id, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora, estado`,
      [api_event_id || null, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora]
    );

    res.status(201).json({
      message: 'Partido registrado exitosamente',
      match: newMatch.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar partido:', error);
    res.status(500).json({ error: 'Error al registrar el partido en la base de datos' });
  }
};

const updateMatch = async (req, res) => {
  const { id } = req.params;
  const { api_event_id, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora, estado } = req.body;

  if (!fase_id || !equipo_local_id || !equipo_visitante_id || !estadio_id || !fecha_hora || !estado) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  if (equipo_local_id === equipo_visitante_id) {
    return res.status(400).json({ error: 'El equipo local y el visitante no pueden ser el mismo' });
  }

  try {
    // Verificar si el partido existe
    const matchCheck = await db.query('SELECT id, goles_local, goles_visitante FROM partidos WHERE id = $1', [id]);
    if (matchCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // Actualizar datos del partido (no permitimos actualizar los goles manualmente)
    const updatedMatch = await db.query(
      `UPDATE partidos
       SET api_event_id = $1, fase_id = $2, equipo_local_id = $3, equipo_visitante_id = $4,
           estadio_id = $5, fecha_hora = $6, estado = $7, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, api_event_id, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora, estado`,
      [api_event_id || null, fase_id, equipo_local_id, equipo_visitante_id, estadio_id, fecha_hora, estado, id]
    );

    res.json({
      message: 'Partido actualizado exitosamente (excluyendo marcadores)',
      match: updatedMatch.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar partido:', error);
    res.status(500).json({ error: 'Error al actualizar el partido en la base de datos' });
  }
};

const triggerSyncToday = async (req, res) => {
  try {
    await syncService.syncTodayMatches();
    res.json({ message: 'Sincronización manual forzada ejecutada con éxito' });
  } catch (error) {
    console.error('Error al forzar la sincronización:', error);
    res.status(500).json({ error: 'Error al ejecutar la sincronización' });
  }
};

const triggerSyncMatch = async (req, res) => {
  const { id } = req.params;
  try {
    const matchRes = await db.query('SELECT id, api_event_id FROM partidos WHERE id = $1', [id]);
    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const match = matchRes.rows[0];
    if (!match.api_event_id) {
      return res.status(400).json({ error: 'El partido no tiene un ID de evento de API asignado' });
    }

    await syncService.syncMatch(match);
    res.json({ message: `Sincronización para el partido ${id} ejecutada con éxito` });
  } catch (error) {
    console.error('Error al sincronizar partido:', error);
    res.status(500).json({ error: 'Error al ejecutar la sincronización para el partido' });
  }
};

module.exports = {
  createMatch,
  updateMatch,
  triggerSyncToday,
  triggerSyncMatch,
};
