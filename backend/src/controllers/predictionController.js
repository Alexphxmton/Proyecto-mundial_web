const { Partido, Pronostico } = require('../config/db');

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
    const partido = await Partido.findByPk(partido_id, { attributes: ['fecha_hora', 'estado'] });

    if (!partido) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // 2. Verificar que el partido no haya empezado
    const matchTime = new Date(partido.fecha_hora);
    const now = new Date();

    if (matchTime <= now || partido.estado !== 'PROGRAMADO') {
      return res.status(400).json({ 
        error: 'No se puede registrar o modificar el pronóstico. El partido ya ha comenzado o finalizado.' 
      });
    }

    const [prediction, created] = await Pronostico.findOrCreate({
      where: { usuario_id: userId, partido_id },
      defaults: { usuario_id: userId, partido_id, goles_local_pronosticado: gLocal, goles_visitante_pronosticado: gVisitante },
    });

    if (!created) {
      await prediction.update({ goles_local_pronosticado: gLocal, goles_visitante_pronosticado: gVisitante });
    }

    res.status(200).json({
      message: 'Pronóstico guardado exitosamente',
      prediction: {
        id: prediction.id,
        usuario_id: prediction.usuario_id,
        partido_id: prediction.partido_id,
        goles_local_pronosticado: prediction.goles_local_pronosticado,
        goles_visitante_pronosticado: prediction.goles_visitante_pronosticado,
      }
    });
  } catch (error) {
    console.error('Error al guardar pronóstico:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

const getUserPredictions = async (req, res) => {
  const userId = req.user.id;

  try {
    const predictions = await Pronostico.findAll({
      where: { usuario_id: userId },
      include: [{
        model: Partido,
        as: 'partido',
        attributes: ['id', 'fecha_hora', 'goles_local', 'goles_visitante', 'estado'],
        include: [
          { model: require('../config/db').Equipo, as: 'equipoLocal', attributes: ['nombre', 'bandera_url', 'codigo_fifa'] },
          { model: require('../config/db').Equipo, as: 'equipoVisitante', attributes: ['nombre', 'bandera_url', 'codigo_fifa'] },
          { model: require('../config/db').Fase, as: 'fase', attributes: ['nombre'] },
        ],
      }],
      attributes: ['id', 'goles_local_pronosticado', 'goles_visitante_pronosticado', 'puntos_obtenidos', 'fecha_creacion'],
      order: [[{ model: Partido, as: 'partido' }, 'fecha_hora', 'ASC']],
    });

    res.json(predictions.map((prediction) => ({
      prediction_id: prediction.id,
      goles_local_pronosticado: prediction.goles_local_pronosticado,
      goles_visitante_pronosticado: prediction.goles_visitante_pronosticado,
      puntos_obtenidos: prediction.puntos_obtenidos,
      fecha_creacion: prediction.fecha_creacion,
      partido_id: prediction.partido.id,
      fecha_hora: prediction.partido.fecha_hora,
      goles_local: prediction.partido.goles_local,
      goles_visitante: prediction.partido.goles_visitante,
      estado: prediction.partido.estado,
      local_nombre: prediction.partido.equipoLocal?.nombre,
      local_bandera: prediction.partido.equipoLocal?.bandera_url,
      local_codigo: prediction.partido.equipoLocal?.codigo_fifa,
      visitante_nombre: prediction.partido.equipoVisitante?.nombre,
      visitante_bandera: prediction.partido.equipoVisitante?.bandera_url,
      visitante_codigo: prediction.partido.equipoVisitante?.codigo_fifa,
      fase_nombre: prediction.partido.fase?.nombre,
    })));
  } catch (error) {
    console.error('Error al obtener pronósticos del usuario:', error);
    res.status(500).json({ error: 'Error al obtener los pronósticos' });
  }
};

module.exports = {
  savePrediction,
  getUserPredictions,
};
