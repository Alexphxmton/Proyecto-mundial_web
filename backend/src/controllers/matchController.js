const { Partido, Fase, Estadio, Ciudad, Equipo, Pronostico } = require('../config/db');
const { Op } = require('sequelize');

const getMatches = async (req, res) => {
  const { fase_id, estado, fecha } = req.query;

  try {
    const where = {};
    if (fase_id) where.fase_id = parseInt(fase_id);
    if (estado) where.estado = estado;
    if (fecha) {
      const start = new Date(fecha); start.setHours(0,0,0,0);
      const end = new Date(fecha); end.setHours(23,59,59,999);
      where.fecha_hora = { [Op.between]: [start, end] };
    }

    const matches = await Partido.findAll({
      where,
      attributes: ['id', 'api_event_id', 'fecha_hora', 'goles_local', 'goles_visitante', 'estado'],
      include: [
        { model: Fase, as: 'fase', attributes: ['id', 'nombre'] },
        { model: Equipo, as: 'equipoLocal', attributes: ['nombre', 'codigo_fifa', 'bandera_url'] },
        { model: Equipo, as: 'equipoVisitante', attributes: ['nombre', 'codigo_fifa', 'bandera_url'] },
        { model: Estadio, as: 'estadio', attributes: ['nombre'], include: [{ model: Ciudad, as: 'ciudad', attributes: ['nombre', 'pais', 'latitud', 'longitud'] }] },
      ],
      order: [['fecha_hora', 'ASC']],
    });

    const userId = req.user ? req.user.id : null;
    let result = matches.map((match) => ({
      id: match.id,
      api_event_id: match.api_event_id,
      fecha_hora: match.fecha_hora,
      goles_local: match.goles_local,
      goles_visitante: match.goles_visitante,
      estado: match.estado,
      fase_nombre: match.fase?.nombre,
      fase_id: match.fase?.id,
      local_nombre: match.equipoLocal?.nombre,
      local_codigo: match.equipoLocal?.codigo_fifa,
      local_bandera: match.equipoLocal?.bandera_url,
      visitante_nombre: match.equipoVisitante?.nombre,
      visitante_codigo: match.equipoVisitante?.codigo_fifa,
      visitante_bandera: match.equipoVisitante?.bandera_url,
      estadio_nombre: match.estadio?.nombre,
      ciudad_nombre: match.estadio?.ciudad?.nombre,
      ciudad_pais: match.estadio?.ciudad?.pais,
      latitud: match.estadio?.ciudad?.latitud,
      longitud: match.estadio?.ciudad?.longitud,
    }));

    if (userId) {
      const predictions = await Pronostico.findAll({ where: { usuario_id: userId }, attributes: ['partido_id', 'goles_local_pronosticado', 'goles_visitante_pronosticado', 'puntos_obtenidos'] });
      const predMap = Object.fromEntries(predictions.map((p) => [p.partido_id, p]));
      result = result.map((m) => ({ ...m, pronostico: predMap[m.id] || null }));
    }

    res.json(result);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error al obtener el calendario de partidos' });
  }
};

const getMatchDetail = async (req, res) => {
  const { id } = req.params;
  const userId = req.user ? req.user.id : null;

  try {
    const match = await Partido.findByPk(id, {
      attributes: ['id', 'api_event_id', 'fecha_hora', 'goles_local', 'goles_visitante', 'estado'],
      include: [
        { model: Fase, as: 'fase', attributes: ['id', 'nombre'] },
        { model: Equipo, as: 'equipoLocal', attributes: ['nombre', 'codigo_fifa', 'bandera_url'] },
        { model: Equipo, as: 'equipoVisitante', attributes: ['nombre', 'codigo_fifa', 'bandera_url'] },
        { model: Estadio, as: 'estadio', attributes: ['nombre', 'capacidad'], include: [{ model: Ciudad, as: 'ciudad', attributes: ['nombre', 'pais', 'latitud', 'longitud'] }] },
      ],
    });

    if (!match) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    const response = {
      id: match.id,
      api_event_id: match.api_event_id,
      fecha_hora: match.fecha_hora,
      goles_local: match.goles_local,
      goles_visitante: match.goles_visitante,
      estado: match.estado,
      fase_nombre: match.fase?.nombre,
      fase_id: match.fase?.id,
      local_nombre: match.equipoLocal?.nombre,
      local_codigo: match.equipoLocal?.codigo_fifa,
      local_bandera: match.equipoLocal?.bandera_url,
      visitante_nombre: match.equipoVisitante?.nombre,
      visitante_codigo: match.equipoVisitante?.codigo_fifa,
      visitante_bandera: match.equipoVisitante?.bandera_url,
      estadio_nombre: match.estadio?.nombre,
      estadio_capacidad: match.estadio?.capacidad,
      ciudad_nombre: match.estadio?.ciudad?.nombre,
      ciudad_pais: match.estadio?.ciudad?.pais,
      latitud: match.estadio?.ciudad?.latitud,
      longitud: match.estadio?.ciudad?.longitud,
    };

    if (userId) {
      const pred = await Pronostico.findOne({ where: { usuario_id: userId, partido_id: id }, attributes: ['goles_local_pronosticado', 'goles_visitante_pronosticado', 'puntos_obtenidos'] });
      response.pronostico = pred || null;
    }

    res.json(response);
  } catch (error) {
    console.error('Error al obtener detalle del partido:', error);
    res.status(500).json({ error: 'Error al obtener el detalle del partido' });
  }
};

const getSedes = async (req, res) => {
  try {
    const ciudades = await Ciudad.findAll({
      attributes: ['id', 'nombre', 'pais', 'latitud', 'longitud'],
      include: [{ model: Estadio, as: 'estadios', attributes: ['id', 'nombre', 'capacidad'] }],
      order: [['nombre', 'ASC']],
    });
    res.json(ciudades.map((ciudad) => ({ ...ciudad.toJSON(), estadios: ciudad.estadios || [] })));
  } catch (error) {
    console.error('Error al obtener sedes:', error);
    res.status(500).json({ error: 'Error al obtener las sedes oficiales' });
  }
};

const getFases = async (req, res) => {
  try {
    const fases = await Fase.findAll({ attributes: ['id', 'nombre'], order: [['id', 'ASC']] });
    res.json(fases);
  } catch (error) {
    console.error('Error al obtener fases:', error);
    res.status(500).json({ error: 'Error al obtener las fases del mundial' });
  }
};

const getEquipos = async (req, res) => {
  try {
    const equipos = await Equipo.findAll({ attributes: ['id', 'nombre', 'codigo_fifa', 'grupo_mundial', 'bandera_url'], order: [['nombre', 'ASC']] });
    res.json(equipos);
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
