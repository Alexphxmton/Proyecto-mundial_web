const db = require('../config/db');

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

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Generar un código único
    let inviteCode = generateInviteCode();
    let codeExists = true;
    while (codeExists) {
      const codeCheck = await client.query('SELECT id FROM grupos WHERE codigo_invitacion = $1', [inviteCode]);
      if (codeCheck.rows.length === 0) {
        codeExists = false;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    // 1. Crear el grupo
    const groupRes = await client.query(
      `INSERT INTO grupos (nombre, codigo_invitacion, creador_id)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, codigo_invitacion, creador_id, fecha_creacion`,
      [nombre, inviteCode, creatorId]
    );
    const newGroup = groupRes.rows[0];

    // 2. Agregar al creador como participante
    await client.query(
      `INSERT INTO grupo_usuarios (grupo_id, usuario_id)
       VALUES ($1, $2)`,
      [newGroup.id, creatorId]
    );

    // 3. Inicializar la clasificación para el creador
    // Calculamos si el usuario ya tiene puntos acumulados en pronósticos anteriores
    const totalPuntosRes = await client.query(
      'SELECT COALESCE(SUM(puntos_obtenidos), 0) as total FROM pronosticos WHERE usuario_id = $1',
      [creatorId]
    );
    const puntosIniciales = parseInt(totalPuntosRes.rows[0].total);

    await client.query(
      `INSERT INTO clasificacion_grupo (grupo_id, usuario_id, puntos_totales, posicion)
       VALUES ($1, $2, $3, 1)`,
      [newGroup.id, creatorId, puntosIniciales]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Grupo creado exitosamente',
      group: newGroup,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear grupo:', error);
    res.status(500).json({ error: 'Error al crear el grupo' });
  } finally {
    client.release();
  }
};

const joinGroup = async (req, res) => {
  const { codigo_invitacion } = req.body;
  const userId = req.user.id;

  if (!codigo_invitacion || codigo_invitacion.trim() === '') {
    return res.status(400).json({ error: 'El código de invitación es obligatorio' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Buscar grupo por código
    const groupRes = await client.query(
      'SELECT id, nombre FROM grupos WHERE codigo_invitacion = $1',
      [codigo_invitacion.toUpperCase().trim()]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Código de invitación inválido o grupo no encontrado' });
    }

    const grupo = groupRes.rows[0];

    // 2. Verificar si ya es miembro
    const memberCheck = await client.query(
      'SELECT id FROM grupo_usuarios WHERE grupo_id = $1 AND usuario_id = $2',
      [grupo.id, userId]
    );

    if (memberCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Ya perteneces a este grupo' });
    }

    // 3. Unir al usuario al grupo
    await client.query(
      'INSERT INTO grupo_usuarios (grupo_id, usuario_id) VALUES ($1, $2)',
      [grupo.id, userId]
    );

    // 4. Calcular sus puntos acumulados en pronósticos y agregarlo a clasificacion_grupo
    const totalPuntosRes = await client.query(
      'SELECT COALESCE(SUM(puntos_obtenidos), 0) as total FROM pronosticos WHERE usuario_id = $1',
      [userId]
    );
    const puntosAcumulados = parseInt(totalPuntosRes.rows[0].total);

    // Insertar en la clasificación
    await client.query(
      `INSERT INTO clasificacion_grupo (grupo_id, usuario_id, puntos_totales, posicion)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (grupo_id, usuario_id) DO NOTHING`,
      [grupo.id, userId, puntosAcumulados]
    );

    // 5. Recalcular las posiciones en el grupo ahora que hay un nuevo participante
    const miembrosRes = await client.query(
      'SELECT usuario_id, puntos_totales FROM clasificacion_grupo WHERE grupo_id = $1 ORDER BY puntos_totales DESC',
      [grupo.id]
    );
    
    let posicion = 1;
    for (let i = 0; i < miembrosRes.rows.length; i++) {
      const item = miembrosRes.rows[i];
      if (i > 0 && item.puntos_totales < miembrosRes.rows[i - 1].puntos_totales) {
        posicion = i + 1;
      }
      await client.query(
        'UPDATE clasificacion_grupo SET posicion = $1 WHERE grupo_id = $2 AND usuario_id = $3',
        [posicion, grupo.id, item.usuario_id]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Te has unido al grupo exitosamente',
      group: grupo,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al unirse al grupo:', error);
    res.status(500).json({ error: 'Error al unirse al grupo' });
  } finally {
    client.release();
  }
};

const getUserGroups = async (req, res) => {
  const userId = req.user.id;
  try {
    const groupsRes = await db.query(
      `SELECT g.id, g.nombre, g.codigo_invitacion, g.creador_id, g.fecha_creacion, u.nombre as creador_nombre,
              (SELECT COUNT(*) FROM grupo_usuarios gu WHERE gu.grupo_id = g.id) as total_participantes,
              cg.puntos_totales, cg.posicion
       FROM grupos g
       JOIN grupo_usuarios gu ON g.id = gu.grupo_id
       JOIN usuarios u ON g.creador_id = u.id
       LEFT JOIN clasificacion_grupo cg ON cg.grupo_id = g.id AND cg.usuario_id = $1
       WHERE gu.usuario_id = $1
       ORDER BY g.fecha_creacion DESC`,
      [userId]
    );

    res.json(groupsRes.rows);
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    res.status(500).json({ error: 'Error al obtener los grupos' });
  }
};

const getGroupDetails = async (req, res) => {
  const { id: grupoId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el usuario pertenece al grupo
    const memberCheck = await db.query(
      'SELECT id FROM grupo_usuarios WHERE grupo_id = $1 AND usuario_id = $2',
      [grupoId, userId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No perteneces a este grupo y no puedes ver sus detalles' });
    }

    // Obtener información del grupo
    const groupRes = await db.query(
      `SELECT g.id, g.nombre, g.codigo_invitacion, g.creador_id, u.nombre as creador_nombre, g.fecha_creacion
       FROM grupos g
       JOIN usuarios u ON g.creador_id = u.id
       WHERE g.id = $1`,
      [grupoId]
    );

    if (groupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Obtener participantes
    const participantsRes = await db.query(
      `SELECT u.id, u.nombre, u.email, gu.fecha_union
       FROM usuarios u
       JOIN grupo_usuarios gu ON u.id = gu.usuario_id
       WHERE gu.grupo_id = $1
       ORDER BY gu.fecha_union ASC`,
      [grupoId]
    );

    // Obtener clasificación
    const rankingRes = await db.query(
      `SELECT cg.posicion, cg.puntos_totales, u.nombre as usuario_nombre, u.id as usuario_id, u.email as usuario_email
       FROM clasificacion_grupo cg
       JOIN usuarios u ON cg.usuario_id = u.id
       WHERE cg.grupo_id = $1
       ORDER BY cg.posicion ASC, cg.puntos_totales DESC, u.nombre ASC`,
      [grupoId]
    );

    res.json({
      group: groupRes.rows[0],
      participants: participantsRes.rows,
      ranking: rankingRes.rows,
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
