const bcrypt = require('bcryptjs');
const db = require('./config/db');

const updateAdminPassword = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);

    console.log('Actualizando contraseña del administrador...');
    const result = await db.query(
      `UPDATE usuarios 
       SET password_hash = $1 
       WHERE email = 'admin@quiniela.com' 
       RETURNING id, nombre, email`,
      [hash]
    );

    if (result.rows.length > 0) {
      console.log('Contraseña del administrador actualizada correctamente a: admin123');
      console.log('Usuario:', result.rows[0]);
    } else {
      console.log('No se encontró el usuario administrador semilla.');
    }
  } catch (error) {
    console.error('Error al actualizar contraseña del administrador:', error);
  } finally {
    db.pool.end();
  }
};

updateAdminPassword();
