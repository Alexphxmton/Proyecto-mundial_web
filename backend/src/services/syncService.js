const axios = require('axios');
const db = require('../config/db');
const pointsService = require('./pointsService');

/**
 * Realiza la sincronización de un único partido utilizando su api_event_id.
 */
const syncMatch = async (match) => {
  const { id: partidoId, api_event_id: apiEventId } = match;
  if (!apiEventId) return;

  try {
    console.log(`Sincronizando partido ID: ${partidoId} (API Event ID: ${apiEventId})...`);
    const url = `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${apiEventId}`;
    const response = await axios.get(url);

    if (response.data && response.data.events && response.data.events.length > 0) {
      const event = response.data.events[0];
      
      // Comprobar si el partido ya terminó. 
      // strStatus suele ser "FT" (Full Time), "Match Finished", "Finished" o similar.
      // O si tiene marcadores definidos (no vacíos ni nulos).
      const status = event.strStatus;
      const homeScoreStr = event.intHomeScore;
      const awayScoreStr = event.intAwayScore;

      const isFinished = status === 'FT' || status === 'Finished' || status === 'Match Finished' || 
                         (homeScoreStr !== null && homeScoreStr !== '' && awayScoreStr !== null && awayScoreStr !== '');

      if (isFinished) {
        const golesLocal = parseInt(homeScoreStr);
        const golesVisitante = parseInt(awayScoreStr);

        if (!isNaN(golesLocal) && !isNaN(golesVisitante)) {
          console.log(`Partido ID ${partidoId} ha finalizado. Resultado API: ${golesLocal} - ${golesVisitante}. Actualizando...`);

          // Actualizar partido local en la BD
          await db.query(
            `UPDATE partidos 
             SET goles_local = $1, goles_visitante = $2, estado = 'FINALIZADO', fecha_actualizacion = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [golesLocal, golesVisitante, partidoId]
          );

          // Recalcular puntos y rankings de grupos
          await pointsService.updatePredictionsAndRankings(partidoId, golesLocal, golesVisitante);
        }
      } else if (status === 'Live' || status === 'HT' || status === 'In Progress') {
        // El partido está en curso, actualizar estado local
        console.log(`Partido ID ${partidoId} está en curso. Marcador actual: ${homeScoreStr} - ${awayScoreStr}`);
        const golesLocal = homeScoreStr !== null && homeScoreStr !== '' ? parseInt(homeScoreStr) : null;
        const golesVisitante = awayScoreStr !== null && awayScoreStr !== '' ? parseInt(awayScoreStr) : null;

        await db.query(
          `UPDATE partidos 
           SET goles_local = $1, goles_visitante = $2, estado = 'EN_CURSO', fecha_actualizacion = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [golesLocal, golesVisitante, partidoId]
        );
      } else {
        console.log(`Partido ID ${partidoId} no ha comenzado o estado no reconocido (${status}).`);
      }
    } else {
      console.log(`No se encontraron datos en thesportsdb para el Event ID: ${apiEventId}`);
    }
  } catch (error) {
    console.error(`Error al sincronizar partido ID ${partidoId}:`, error.message);
  }
};

/**
 * Sincroniza todos los partidos pendientes del día actual.
 */
const syncTodayMatches = async () => {
  console.log('Iniciando sincronización automática de partidos del día...');
  try {
    // Buscamos partidos que no estén FINALIZADOS y que tengan un api_event_id asignado
    // También filtramos por partidos cuya fecha sea cercana a hoy (por ejemplo, hoy, ayer o mañana para cubrir zonas horarias)
    const query = `
      SELECT id, api_event_id 
      FROM partidos 
      WHERE estado != 'FINALIZADO' 
        AND api_event_id IS NOT NULL 
        AND fecha_hora::date <= (CURRENT_DATE + INTERVAL '1 day')
    `;
    const res = await db.query(query);
    const matchesToSync = res.rows;

    if (matchesToSync.length === 0) {
      console.log('No hay partidos pendientes para sincronizar en el día de hoy.');
      return;
    }

    console.log(`Se encontraron ${matchesToSync.length} partidos para sincronizar.`);
    for (const match of matchesToSync) {
      await syncMatch(match);
    }
  } catch (error) {
    console.error('Error en la sincronización automática:', error);
  }
};

/**
 * Inicia el proceso de sincronización cada 20 minutos.
 */
const startAutomaticSync = () => {
  // Sincronizar al iniciar
  syncTodayMatches();

  // Cada 20 minutos = 20 * 60 * 1000 ms
  const intervalMs = 20 * 60 * 1000;
  setInterval(syncTodayMatches, intervalMs);
  console.log(`Servicio de sincronización automática activado. Ejecución cada 20 minutos.`);
};

module.exports = {
  syncMatch,
  syncTodayMatches,
  startAutomaticSync,
};
