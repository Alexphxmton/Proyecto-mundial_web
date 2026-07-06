const { Partido } = require('../config/db');
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
    if (api_event_id) {
      const existingApiMatch = await Partido.findOne({ where: { api_event_id } });
      if (existingApiMatch) {
        return res.status(409).json({ error: 'Ya existe un partido registrado con ese TheSportsDB Event ID' });
      }
    }

    const newMatch = await Partido.create({
      api_event_id: api_event_id || null,
      fase_id,
      equipo_local_id,
      equipo_visitante_id,
      estadio_id,
      fecha_hora,
      estado: 'PROGRAMADO',
    });

    res.status(201).json({
      message: 'Partido registrado exitosamente',
      match: newMatch,
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
    const match = await Partido.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    if (api_event_id) {
      const existingApiMatch = await Partido.findOne({ where: { api_event_id } });
      if (existingApiMatch && existingApiMatch.id !== match.id) {
        return res.status(409).json({ error: 'Ya existe otro partido registrado con ese TheSportsDB Event ID' });
      }
    }

    const updatedMatch = await match.update({
      api_event_id: api_event_id || null,
      fase_id,
      equipo_local_id,
      equipo_visitante_id,
      estadio_id,
      fecha_hora,
      estado,
    });

    res.json({
      message: 'Partido actualizado exitosamente (excluyendo marcadores)',
      match: updatedMatch,
    });
  } catch (error) {
    console.error('Error al actualizar partido:', error);
    res.status(500).json({ error: 'Error al actualizar el partido en la base de datos' });
  }
};

const triggerSyncToday = async (req, res) => {
  try {
    const summary = await syncService.syncTodayMatches();
    res.json({
      message: `Sincronización ejecutada: ${summary.created} partidos creados, ${summary.updated} actualizados, ${summary.skipped} omitidos.`,
      summary,
    });
  } catch (error) {
    console.error('Error al forzar la sincronización:', error);
    res.status(500).json({ error: 'Error al ejecutar la sincronización' });
  }
};

const triggerSyncMatch = async (req, res) => {
  const { id } = req.params;
  try {
    const match = await Partido.findByPk(id, { attributes: ['id', 'api_event_id'] });
    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

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
