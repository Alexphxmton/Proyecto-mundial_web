const axios = require('axios');
const { Op } = require('sequelize');
const { sequelize, Partido, Equipo, Estadio, Ciudad, Fase } = require('../config/db');
const pointsService = require('./pointsService');

const API_KEY = process.env.THESPORTSDB_API_KEY || '3';
const WORLD_CUP_LEAGUE_ID = process.env.THESPORTSDB_WORLD_CUP_LEAGUE_ID || '4429';
const WORLD_CUP_SEASON = process.env.THESPORTSDB_WORLD_CUP_SEASON || '2026';
const API_BASE_URL = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const HOST_VENUES = [
  { match: 'metlife', stadium: 'MetLife Stadium', city: 'East Rutherford', country: 'Estados Unidos', latitud: 40.8135, longitud: -74.0745 },
  { match: 'at&t', stadium: 'AT&T Stadium', city: 'Arlington', country: 'Estados Unidos', latitud: 32.7473, longitud: -97.0945 },
  { match: 'att stadium', stadium: 'AT&T Stadium', city: 'Arlington', country: 'Estados Unidos', latitud: 32.7473, longitud: -97.0945 },
  { match: 'mercedes-benz', stadium: 'Mercedes-Benz Stadium', city: 'Atlanta', country: 'Estados Unidos', latitud: 33.7554, longitud: -84.4008 },
  { match: 'sofi', stadium: 'SoFi Stadium', city: 'Inglewood', country: 'Estados Unidos', latitud: 33.9535, longitud: -118.3392 },
  { match: 'hard rock', stadium: 'Hard Rock Stadium', city: 'Miami Gardens', country: 'Estados Unidos', latitud: 25.9580, longitud: -80.2389 },
  { match: 'gillette', stadium: 'Gillette Stadium', city: 'Foxborough', country: 'Estados Unidos', latitud: 42.0909, longitud: -71.2643 },
  { match: 'nrg', stadium: 'NRG Stadium', city: 'Houston', country: 'Estados Unidos', latitud: 29.6847, longitud: -95.4107 },
  { match: 'lincoln financial', stadium: 'Lincoln Financial Field', city: 'Philadelphia', country: 'Estados Unidos', latitud: 39.9008, longitud: -75.1675 },
  { match: 'lumen', stadium: 'Lumen Field', city: 'Seattle', country: 'Estados Unidos', latitud: 47.5952, longitud: -122.3316 },
  { match: 'levi', stadium: "Levi's Stadium", city: 'Santa Clara', country: 'Estados Unidos', latitud: 37.4030, longitud: -121.9700 },
  { match: 'arrowhead', stadium: 'Arrowhead Stadium', city: 'Kansas City', country: 'Estados Unidos', latitud: 39.0490, longitud: -94.4839 },
  { match: 'bmo field', stadium: 'BMO Field', city: 'Toronto', country: 'Canadá', latitud: 43.6332, longitud: -79.4186 },
  { match: 'bc place', stadium: 'BC Place', city: 'Vancouver', country: 'Canadá', latitud: 49.2767, longitud: -123.1119 },
  { match: 'azteca', stadium: 'Estadio Azteca', city: 'Ciudad de México', country: 'México', latitud: 19.3029, longitud: -99.1505 },
  { match: 'akron', stadium: 'Estadio Akron', city: 'Guadalajara', country: 'México', latitud: 20.6817, longitud: -103.4629 },
  { match: 'bbva', stadium: 'Estadio BBVA', city: 'Monterrey', country: 'México', latitud: 25.6682, longitud: -100.2445 },
];

const normalize = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const cleanText = (value) => {
  if (value === undefined || value === null) return null;
  const text = value.toString().trim();
  return text.length ? text : null;
};

const parseScore = (value) => {
  const text = cleanText(value);
  if (text === null) return null;
  const score = parseInt(text, 10);
  return Number.isNaN(score) ? null : score;
};

const buildEventDate = (event) => {
  if (event.strTimestamp) {
    const timestampDate = new Date(event.strTimestamp);
    if (!Number.isNaN(timestampDate.getTime())) return timestampDate;
  }

  const date = cleanText(event.dateEvent) || cleanText(event.dateEventLocal);
  if (!date) return null;

  const time = cleanText(event.strTime) || cleanText(event.strTimeLocal) || '00:00:00';
  const normalizedTime = time.replace('Z', '');
  const eventDate = new Date(`${date}T${normalizedTime}Z`);
  return Number.isNaN(eventDate.getTime()) ? new Date(date) : eventDate;
};

const mapStatus = (event) => {
  const status = normalize(event.strStatus || event.strProgress);
  const homeScore = parseScore(event.intHomeScore);
  const awayScore = parseScore(event.intAwayScore);

  if (
    ['ft', 'finished', 'match finished', 'aet', 'pen'].includes(status) ||
    (homeScore !== null && awayScore !== null && ['match finished', 'final'].includes(status))
  ) {
    return 'FINALIZADO';
  }

  if (['live', 'ht', 'in progress', '1h', '2h', 'et', 'penalties'].includes(status)) {
    return 'EN_CURSO';
  }

  return 'PROGRAMADO';
};

const findByNormalizedName = async (Model, name, extraWhere = {}, transaction) => {
  if (!name) return null;

  const rows = await Model.findAll({
    where: extraWhere,
    transaction,
  });

  return rows.find((row) => normalize(row.nombre) === normalize(name)) || null;
};

const getOrCreateFase = async (event, transaction) => {
  const round = cleanText(event.strRound);
  const phaseName = round ? `Ronda ${round}` : cleanText(event.strGroup) || 'Fase de grupos';

  const [fase] = await Fase.findOrCreate({
    where: { nombre: phaseName },
    defaults: { nombre: phaseName },
    transaction,
  });

  return fase;
};

const getOrCreateEquipo = async (name, badgeUrl, shortCode, transaction) => {
  const teamName = cleanText(name) || 'Equipo por confirmar';
  const existingByName = await findByNormalizedName(Equipo, teamName, {}, transaction);
  if (existingByName) {
    const updates = {};
    if (!existingByName.bandera_url && badgeUrl) updates.bandera_url = badgeUrl;
    if (!existingByName.codigo_fifa && shortCode) {
      const codeOwner = await Equipo.findOne({ where: { codigo_fifa: shortCode }, transaction });
      if (!codeOwner) updates.codigo_fifa = shortCode;
    }
    return Object.keys(updates).length ? existingByName.update(updates, { transaction }) : existingByName;
  }

  let codigo_fifa = cleanText(shortCode);
  if (codigo_fifa) {
    codigo_fifa = codigo_fifa.toUpperCase().slice(0, 10);
    const codeOwner = await Equipo.findOne({ where: { codigo_fifa }, transaction });
    if (codeOwner) codigo_fifa = null;
  }

  return Equipo.create(
    {
      nombre: teamName,
      codigo_fifa,
      bandera_url: cleanText(badgeUrl),
    },
    { transaction }
  );
};

const resolveVenueInfo = (event) => {
  const apiVenue = cleanText(event.strVenue) || 'Estadio por confirmar';
  const normalizedVenue = normalize(apiVenue);
  const hostVenue = HOST_VENUES.find((venue) => normalizedVenue.includes(venue.match));

  if (hostVenue) {
    return hostVenue;
  }

  return {
    stadium: apiVenue,
    city: cleanText(event.strCity) || cleanText(event.strVenueLocation) || 'Ciudad por confirmar',
    country: cleanText(event.strCountry) || 'País por confirmar',
    latitud: null,
    longitud: null,
  };
};

const getOrCreateEstadio = async (event, transaction) => {
  const venue = resolveVenueInfo(event);
  let ciudad = await findByNormalizedName(Ciudad, venue.city, { pais: venue.country }, transaction);

  if (!ciudad) {
    ciudad = await Ciudad.create(
      {
        nombre: venue.city,
        pais: venue.country,
        latitud: venue.latitud,
        longitud: venue.longitud,
      },
      { transaction }
    );
  }

  let estadio = await findByNormalizedName(Estadio, venue.stadium, { ciudad_id: ciudad.id }, transaction);
  if (!estadio) {
    estadio = await Estadio.create(
      {
        nombre: venue.stadium,
        ciudad_id: ciudad.id,
      },
      { transaction }
    );
  }

  return estadio;
};

const eventBelongsToWorldCup = (event) => {
  const league = normalize(event.strLeague);
  const season = cleanText(event.strSeason);
  const sport = normalize(event.strSport);

  return (
    (!sport || sport === 'soccer') &&
    (league.includes('world cup') || event.idLeague === WORLD_CUP_LEAGUE_ID) &&
    (!season || season === WORLD_CUP_SEASON)
  );
};

const fetchApiEvents = async (path, params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/${path}`, { params });
  return response.data?.events || [];
};

const fetchWorldCupEvents = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const requests = [
    fetchApiEvents('eventsseason.php', { id: WORLD_CUP_LEAGUE_ID, s: WORLD_CUP_SEASON }),
    fetchApiEvents('eventsday.php', { d: today, s: 'Soccer' }),
    fetchApiEvents('eventsnextleague.php', { id: WORLD_CUP_LEAGUE_ID }),
  ];

  const results = await Promise.allSettled(requests);
  const eventsById = new Map();

  results.forEach((result) => {
    if (result.status !== 'fulfilled') {
      console.error('Error al consultar TheSportsDB:', result.reason.message);
      return;
    }

    result.value
      .filter((event) => event?.idEvent && eventBelongsToWorldCup(event))
      .forEach((event) => eventsById.set(event.idEvent.toString(), event));
  });

  return Array.from(eventsById.values());
};

const updateMatchFromEvent = async (match, event, transaction) => {
  const fechaHora = buildEventDate(event);
  const golesLocal = parseScore(event.intHomeScore);
  const golesVisitante = parseScore(event.intAwayScore);
  const estado = mapStatus(event);
  const updates = {
    estado,
    fecha_actualizacion: new Date(),
  };

  if (fechaHora) updates.fecha_hora = fechaHora;
  updates.goles_local = golesLocal;
  updates.goles_visitante = golesVisitante;

  const shouldRecalculate =
    estado === 'FINALIZADO' &&
    golesLocal !== null &&
    golesVisitante !== null &&
    (match.estado !== 'FINALIZADO' || match.goles_local !== golesLocal || match.goles_visitante !== golesVisitante);

  await match.update(updates, { transaction });

  if (shouldRecalculate) {
    await pointsService.updatePredictionsAndRankings(match.id, golesLocal, golesVisitante);
  }
};

const findExistingManualMatch = async (equipoLocal, equipoVisitante, fechaHora, transaction) => {
  if (!fechaHora) return null;

  const windowStart = new Date(fechaHora.getTime() - 12 * 60 * 60 * 1000);
  const windowEnd = new Date(fechaHora.getTime() + 12 * 60 * 60 * 1000);

  return Partido.findOne({
    where: {
      api_event_id: null,
      equipo_local_id: equipoLocal.id,
      equipo_visitante_id: equipoVisitante.id,
      fecha_hora: { [Op.between]: [windowStart, windowEnd] },
    },
    transaction,
  });
};

const upsertEvent = async (event) => {
  const apiEventId = cleanText(event.idEvent);
  if (!apiEventId) return { created: false, updated: false, skipped: true };

  return sequelize.transaction(async (transaction) => {
    const existingMatch = await Partido.findOne({
      where: { api_event_id: apiEventId },
      transaction,
    });

    if (existingMatch) {
      await updateMatchFromEvent(existingMatch, event, transaction);
      return { created: false, updated: true, skipped: false };
    }

    const fechaHora = buildEventDate(event);
    if (!fechaHora) {
      return { created: false, updated: false, skipped: true };
    }

    const fase = await getOrCreateFase(event, transaction);
    const equipoLocal = await getOrCreateEquipo(
      event.strHomeTeam,
      event.strHomeTeamBadge,
      event.strHomeTeamShort || event.strHomeTeamCode,
      transaction
    );
    const equipoVisitante = await getOrCreateEquipo(
      event.strAwayTeam,
      event.strAwayTeamBadge,
      event.strAwayTeamShort || event.strAwayTeamCode,
      transaction
    );
    const estadio = await getOrCreateEstadio(event, transaction);

    if (equipoLocal.id === equipoVisitante.id) {
      return { created: false, updated: false, skipped: true };
    }

    const existingManualMatch = await findExistingManualMatch(equipoLocal, equipoVisitante, fechaHora, transaction);
    if (existingManualMatch) {
      await existingManualMatch.update({ api_event_id: apiEventId }, { transaction });
      await updateMatchFromEvent(existingManualMatch, event, transaction);
      return { created: false, updated: true, skipped: false };
    }

    await Partido.create(
      {
        api_event_id: apiEventId,
        fase_id: fase.id,
        equipo_local_id: equipoLocal.id,
        equipo_visitante_id: equipoVisitante.id,
        estadio_id: estadio.id,
        fecha_hora: fechaHora,
        goles_local: parseScore(event.intHomeScore),
        goles_visitante: parseScore(event.intAwayScore),
        estado: mapStatus(event),
      },
      { transaction }
    );

    return { created: true, updated: false, skipped: false };
  });
};

/**
 * Realiza la sincronización de un único partido utilizando su api_event_id.
 */
const syncMatch = async (match) => {
  const { id: partidoId, api_event_id: apiEventId } = match;
  if (!apiEventId) return { updated: false };

  try {
    console.log(`Sincronizando partido ID: ${partidoId} (API Event ID: ${apiEventId})...`);
    const events = await fetchApiEvents('lookupevent.php', { id: apiEventId });

    if (events.length === 0) {
      console.log(`No se encontraron datos en TheSportsDB para el Event ID: ${apiEventId}`);
      return { updated: false };
    }

    const event = events[0];
    const dbMatch = await Partido.findByPk(partidoId);
    if (!dbMatch) return { updated: false };

    await sequelize.transaction(async (transaction) => {
      await updateMatchFromEvent(dbMatch, event, transaction);
    });

    return { updated: true };
  } catch (error) {
    console.error(`Error al sincronizar partido ID ${partidoId}:`, error.message);
    throw error;
  }
};

/**
 * Importa/actualiza automáticamente los partidos del Mundial 2026 desde TheSportsDB.
 */
const syncTodayMatches = async () => {
  console.log('Iniciando sincronización automática de partidos del Mundial 2026...');

  const summary = {
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    syncedManual: 0,
  };

  try {
    const apiEvents = await fetchWorldCupEvents();
    const importedApiEventIds = apiEvents.map((event) => cleanText(event.idEvent)).filter(Boolean);
    summary.fetched = apiEvents.length;

    for (const event of apiEvents) {
      try {
        const result = await upsertEvent(event);
        if (result.created) summary.created += 1;
        if (result.updated) summary.updated += 1;
        if (result.skipped) summary.skipped += 1;
      } catch (error) {
        summary.skipped += 1;
        console.error(`Error al importar evento ${event.idEvent}:`, error.message);
      }
    }

    const manualMatchesToSync = await Partido.findAll({
      attributes: ['id', 'api_event_id'],
      where: {
        estado: { [Op.ne]: 'FINALIZADO' },
        api_event_id: importedApiEventIds.length
          ? { [Op.ne]: null, [Op.notIn]: importedApiEventIds }
          : { [Op.ne]: null },
      },
    });

    for (const match of manualMatchesToSync) {
      await syncMatch(match.toJSON());
      summary.syncedManual += 1;
    }

    console.log(
      `Sincronización finalizada. API: ${summary.fetched}, creados: ${summary.created}, actualizados: ${summary.updated}, omitidos: ${summary.skipped}.`
    );

    return summary;
  } catch (error) {
    console.error('Error en la sincronización automática:', error.message);
    throw error;
  }
};

/**
 * Inicia el proceso de sincronización cada 20 minutos.
 */
const startAutomaticSync = () => {
  syncTodayMatches().catch((error) => {
    console.error('Error al ejecutar la sincronización inicial:', error.message);
  });

  const intervalMs = 20 * 60 * 1000;
  setInterval(() => {
    syncTodayMatches().catch((error) => {
      console.error('Error al ejecutar la sincronización programada:', error.message);
    });
  }, intervalMs);

  console.log('Servicio de sincronización automática activado. Ejecución cada 20 minutos.');
};

module.exports = {
  syncMatch,
  syncTodayMatches,
  startAutomaticSync,
};
