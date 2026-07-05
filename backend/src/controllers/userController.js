const bcrypt = require('bcryptjs');
const db = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const userRes = await db.query(
      `SELECT id, nombre, email, rol_id, activo, fecha_creacion
       FROM usuarios
       WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(userRes.rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener los datos del perfil' });
  }
};

const updateProfile = async (req, res) => {
  const { nombre, email, password } = req.body;
  const userId = req.user.id;

  if (!nombre || !email) {
    return res.status(400).json({ error: 'El nombre y el correo son obligatorios' });
  }

  try {
    // Validar si el email ya existe en otro usuario
    const emailCheck = await db.query(
      'SELECT id FROM usuarios WHERE email = $1 AND id != $2',
      [email, userId]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
    }

    let query = '';
    let params = [];

    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      
      query = `UPDATE usuarios 
               SET nombre = $1, email = $2, password_hash = $3, fecha_actualizacion = CURRENT_TIMESTAMP 
               WHERE id = $4 
               RETURNING id, nombre, email`;
      params = [nombre, email, passwordHash, userId];
    } else {
      query = `UPDATE usuarios 
               SET nombre = $1, email = $2, fecha_actualizacion = CURRENT_TIMESTAMP 
               WHERE id = $3 
               RETURNING id, nombre, email`;
      params = [nombre, email, userId];
    }

    const updatedUser = await db.query(query, params);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
