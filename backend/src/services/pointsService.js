const { sequelize, Pronostico, Grupo, GrupoUsuario, ClasificacionGrupo } = require('../config/db');

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
  const transaction = await sequelize.transaction();
  try {
    const predictions = await Pronostico.findAll({ where: { partido_id: partidoId }, transaction });

    for (const pred of predictions) {
      const puntos = calculatePoints(
        pred.goles_local_pronosticado,
        pred.goles_visitante_pronosticado,
        golesLocal,
        golesVisitante
      );
      await pred.update({ puntos_obtenidos: puntos, fecha_actualizacion: new Date() }, { transaction });
    }

    const grupos = await Grupo.findAll({ attributes: ['id'], transaction });

    for (const grupo of grupos) {
      const miembros = await GrupoUsuario.findAll({ where: { grupo_id: grupo.id }, attributes: ['usuario_id'], transaction });
      const miembrosPuntos = [];

      for (const miembro of miembros) {
        const puntosTotales = await Pronostico.sum('puntos_obtenidos', { where: { usuario_id: miembro.usuario_id }, transaction }) || 0;
        miembrosPuntos.push({ usuario_id: miembro.usuario_id, puntos_totales: puntosTotales });
      }

      miembrosPuntos.sort((a, b) => b.puntos_totales - a.puntos_totales);

      let posicion = 1;
      for (let i = 0; i < miembrosPuntos.length; i++) {
        const item = miembrosPuntos[i];
        if (i > 0 && item.puntos_totales < miembrosPuntos[i - 1].puntos_totales) {
          posicion = i + 1;
        }

        await ClasificacionGrupo.upsert({
          grupo_id: grupo.id,
          usuario_id: item.usuario_id,
          puntos_totales: item.puntos_totales,
          posicion,
          fecha_actualizacion: new Date(),
        }, { transaction });
      }
    }

    await transaction.commit();
    console.log(`Puntos y clasificaciones actualizados exitosamente para el partido ID: ${partidoId}`);
  } catch (error) {
    await transaction.rollback();
    console.error('Error en updatePredictionsAndRankings:', error);
    throw error;
  }
};

module.exports = {
  calculatePoints,
  updatePredictionsAndRankings,
};
