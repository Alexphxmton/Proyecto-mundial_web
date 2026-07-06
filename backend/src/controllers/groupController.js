const { Grupo, GrupoUsuario, ClasificacionGrupo, Pronostico, Usuario } = require('../config/db');

// Generador de códigos de invitación
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const createGroup = async (req, res) => {
  const { nombre } = req.body;
  const creatorId = req.user.id;

  if (!nombre || nombre.trim() === '') {
    return res.status(400).json({ error: 'El nombre del grupo es obligatorio' });
  }

  const transaction = await require('../config/db').sequelize.transaction();
  try {
    let inviteCode = generateInviteCode();
    let codeExists = true;
    while (codeExists) {
      const existing = await Grupo.findOne({ where: { codigo_invitacion: inviteCode }, transaction });
      if (!existing) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    const newGroup = await Grupo.create({ nombre, codigo_invitacion: inviteCode, creador_id: creatorId }, { transaction });
    await GrupoUsuario.create({ grupo_id: newGroup.id, usuario_id: creatorId }, { transaction });

    const puntosIniciales = await Pronostico.sum('puntos_obtenidos', { where: { usuario_id: creatorId }, transaction }) || 0;
    await ClasificacionGrupo.create({ grupo_id: newGroup.id, usuario_id: creatorId, puntos_totales: puntosIniciales, posicion: 1 }, { transaction });

    await transaction.commit();

    res.status(201).json({
      message: 'Grupo creado exitosamente',
      group: newGroup,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  }
};

const joinGroup = async (req, res) => {
  const { codigo_invitacion } = req.body;
  const userId = req.user.id;

  if (!codigo_invitacion || codigo_invitacion.trim() === '') {
    return res.status(400).json({ error: 'El código de invitación es obligatorio' });
  }

  const transaction = await require('../config/db').sequelize.transaction();
  try {
    const grupo = await Grupo.findOne({ where: { codigo_invitacion: codigo_invitacion.toUpperCase().trim() }, transaction });

    if (!grupo) {
      return res.status(404).json({ error: 'Código de invitación inválido o grupo no encontrado' });
    }

    const memberCheck = await GrupoUsuario.findOne({ where: { grupo_id: grupo.id, usuario_id: userId }, transaction });
    if (memberCheck) {
      return res.status(400).json({ error: 'Ya perteneces a este grupo' });
    }

    await GrupoUsuario.create({ grupo_id: grupo.id, usuario_id: userId }, { transaction });

    const puntosAcumulados = await Pronostico.sum('puntos_obtenidos', { where: { usuario_id: userId }, transaction }) || 0;
    await ClasificacionGrupo.create({ grupo_id: grupo.id, usuario_id: userId, puntos_totales: puntosAcumulados, posicion: 1 }, { transaction });

    const miembros = await ClasificacionGrupo.findAll({ where: { grupo_id: grupo.id }, order: [['puntos_totales', 'DESC'], ['usuario_id', 'ASC']], transaction });
    let posicion = 1;
    for (let i = 0; i < miembros.length; i++) {
      const item = miembros[i];
      if (i > 0 && item.puntos_totales < miembros[i - 1].puntos_totales) {
        posicion = i + 1;
      }
      await item.update({ posicion }, { transaction });
    }

    await transaction.commit();

    res.status(200).json({
      message: 'Te has unido al grupo exitosamente',
      group: grupo,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al unirse al grupo:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  }
};

const getUserGroups = async (req, res) => {
  const userId = req.user.id;
  try {
    const groups = await Grupo.findAll({
      attributes: ['id', 'nombre', 'codigo_invitacion', 'creador_id', 'fecha_creacion'],
      include: [
        { model: Usuario, as: 'creador', attributes: ['nombre'] },
        { model: GrupoUsuario, as: 'grupoUsuarios', attributes: ['id'] },
        { model: ClasificacionGrupo, as: 'clasificaciones', where: { usuario_id: userId }, required: false, attributes: ['puntos_totales', 'posicion'] },
      ],
      where: { '$grupoUsuarios.usuario_id$': userId },
      order: [['fecha_creacion', 'DESC']],
    });

    const mapped = groups.map((group) => ({
      id: group.id,
      nombre: group.nombre,
      codigo_invitacion: group.codigo_invitacion,
      creador_id: group.creador_id,
      fecha_creacion: group.fecha_creacion,
      creador_nombre: group.creador?.nombre,
      total_participantes: group.grupoUsuarios?.length || 0,
      puntos_totales: group.clasificaciones?.[0]?.puntos_totales || 0,
      posicion: group.clasificaciones?.[0]?.posicion || null,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
};

const getGroupDetails = async (req, res) => {
  const { id: grupoId } = req.params;
  const userId = req.user.id;

  try {
    const memberCheck = await GrupoUsuario.findOne({ where: { grupo_id: grupoId, usuario_id: userId } });
    if (!memberCheck) {
      return res.status(403).json({ error: 'No perteneces a este grupo y no puedes ver sus detalles' });
    }

    const group = await Grupo.findOne({
      where: { id: grupoId },
      include: [{ model: Usuario, as: 'creador', attributes: ['id', 'nombre'] }],
      attributes: ['id', 'nombre', 'codigo_invitacion', 'creador_id', 'fecha_creacion'],
    });

    if (!group) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const participants = await GrupoUsuario.findAll({
      where: { grupo_id: grupoId },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      attributes: ['fecha_union'],
      order: [['fecha_union', 'ASC']],
    });

    const ranking = await ClasificacionGrupo.findAll({
      where: { grupo_id: grupoId },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] }],
      attributes: ['posicion', 'puntos_totales'],
      order: [['posicion', 'ASC'], ['puntos_totales', 'DESC'], ['usuario_id', 'ASC']],
    });

    res.json({
      group: {
        id: group.id,
        nombre: group.nombre,
        codigo_invitacion: group.codigo_invitacion,
        creador_id: group.creador_id,
        creador_nombre: group.creador?.nombre,
        fecha_creacion: group.fecha_creacion,
      },
      participants: participants.map((entry) => ({
        id: entry.usuario.id,
        nombre: entry.usuario.nombre,
        email: entry.usuario.email,
        fecha_union: entry.fecha_union,
      })),
      ranking: ranking.map((entry) => ({
        posicion: entry.posicion,
        puntos_totales: entry.puntos_totales,
        usuario_nombre: entry.usuario.nombre,
        usuario_id: entry.usuario.id,
        usuario_email: entry.usuario.email,
      })),
    });
  } catch (error) {
    console.error('Error al obtener detalle del grupo:', error);
    res.status(500).json({ error: 'Error al obtener los detalles del grupo' });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  getUserGroups,
  getGroupDetails,
};
