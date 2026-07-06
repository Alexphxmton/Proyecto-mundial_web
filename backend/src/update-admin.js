const bcrypt = require('bcryptjs');
const { Usuario } = require('./config/db');

const updateAdminPassword = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    console.log('Actualizando contraseña del administrador...');
    const [updatedRowsCount, updatedUsers] = await Usuario.update(
      { password_hash: hash, fecha_actualizacion: new Date() },
      { where: { email: 'admin@quiniela.com' }, returning: true }
    );

    if (updatedUsers.length > 0) {
      console.log('Contraseña del administrador actualizada correctamente a: admin123');
      console.log('Usuario:', updatedUsers[0]);
    } else {
      console.log('No se encontró el usuario administrador semilla.');
    }
  } catch (error) {
    console.error('Error al actualizar contraseña del administrador:', error);
  } finally {
    process.exit(0);
  }
};

updateAdminPassword();
