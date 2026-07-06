const bcrypt = require('bcryptjs');
const { Usuario } = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const user = await Usuario.findByPk(req.user.id, { attributes: ['id', 'nombre', 'email', 'rol_id', 'activo', 'fecha_creacion'] });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user.toJSON());
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
    const emailCheck = await Usuario.findOne({ where: { email, id: { $ne: userId } } });
    if (emailCheck) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado por otro usuario' });
    }

    const updateData = { nombre, email };
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await Usuario.update(updateData, { where: { id: userId }, returning: true });
    const user = updatedUser[1][0];

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: { id: user.id, nombre: user.nombre, email: user.email },
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
