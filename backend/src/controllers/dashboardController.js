const { GrupoUsuario, Partido, Equipo, Fase, Estadio, Ciudad, ClasificacionGrupo, Pronostico } = require('../config/db');

const getSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const cantidadGrupos = await GrupoUsuario.count({ where: { usuario_id: userId } });

    const pendingMatches = await Partido.findAll({
      where: { estado: 'PROGRAMADO' },
      include: [
        { model: Equipo, as: 'equipoLocal', attributes: ['nombre', 'bandera_url', 'codigo_fifa'] },
        { model: Equipo, as: 'equipoVisitante', attributes: ['nombre', 'bandera_url', 'codigo_fifa'] },
        { model: Fase, as: 'fase', attributes: ['nombre'] },
        { model: Estadio, as: 'estadio', include: [{ model: Ciudad, as: 'ciudad', attributes: ['nombre'] }] },
        { model: Pronostico, as: 'pronosticos', where: { usuario_id: userId }, required: false, attributes: ['id'] },
      ],
      order: [['fecha_hora', 'ASC']],
      limit: 5,
    });
    const proximosPendientes = pendingMatches
      .filter((match) => match.pronosticos.length === 0 && new Date(match.fecha_hora) > new Date())
      .map((match) => ({
        id: match.id,
        fecha_hora: match.fecha_hora,
        local_nombre: match.equipoLocal?.nombre,
        local_bandera: match.equipoLocal?.bandera_url,
        local_codigo: match.equipoLocal?.codigo_fifa,
        visitante_nombre: match.equipoVisitante?.nombre,
        visitante_bandera: match.equipoVisitante?.bandera_url,
        visitante_codigo: match.equipoVisitante?.codigo_fifa,
        fase_nombre: match.fase?.nombre,
        estadio_nombre: match.estadio?.nombre,
        ciudad_nombre: match.estadio?.ciudad?.nombre,
      }));

    const posicionesGrupos = await ClasificacionGrupo.findAll({
      where: { usuario_id: userId },
      include: [{ model: require('../config/db').Grupo, as: 'grupo', attributes: ['id', 'nombre', 'codigo_invitacion'] }],
      attributes: ['posicion', 'puntos_totales'],
      order: [['grupo', 'nombre', 'ASC']],
    });

    const puntajeAcumulado = await Pronostico.sum('puntos_obtenidos', { where: { usuario_id: userId } }) || 0;

    res.json({
      cantidadGrupos,
      proximosPendientes,
      posicionesGrupos: posicionesGrupos.map((entry) => ({
        grupo_id: entry.grupo.id,
        grupo_nombre: entry.grupo.nombre,
        codigo_invitacion: entry.grupo.codigo_invitacion,
        posicion: entry.posicion,
        puntos_totales: entry.puntos_totales,
        total_miembros: 0,
      })),
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
