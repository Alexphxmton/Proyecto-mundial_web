const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'quiniela_2026',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD === '' ? '' : (process.env.DB_PASSWORD || undefined),
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres',
    logging: false,
    define: {
      timestamps: false,
    },
  }
);

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(30), allowNull: false, unique: true },
}, { tableName: 'roles' });

const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  rol_id: { type: DataTypes.INTEGER, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'usuarios' });

const Ciudad = sequelize.define('Ciudad', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  pais: { type: DataTypes.STRING(100), allowNull: false },
  latitud: { type: DataTypes.DECIMAL(10, 7) },
  longitud: { type: DataTypes.DECIMAL(10, 7) },
}, { tableName: 'ciudades' });

const Estadio = sequelize.define('Estadio', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  capacidad: { type: DataTypes.INTEGER },
  ciudad_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'estadios' });

const Equipo = sequelize.define('Equipo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  codigo_fifa: { type: DataTypes.STRING(10), unique: true },
  grupo_mundial: { type: DataTypes.STRING(5) },
  bandera_url: { type: DataTypes.TEXT },
}, { tableName: 'equipos' });

const Fase = sequelize.define('Fase', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false, unique: true },
}, { tableName: 'fases' });

const Grupo = sequelize.define('Grupo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(150), allowNull: false },
  codigo_invitacion: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  creador_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'grupos' });

const GrupoUsuario = sequelize.define('GrupoUsuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  grupo_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_union: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'grupo_usuarios' });

const Partido = sequelize.define('Partido', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  api_event_id: { type: DataTypes.STRING(50), unique: true },
  fase_id: { type: DataTypes.INTEGER, allowNull: false },
  equipo_local_id: { type: DataTypes.INTEGER, allowNull: false },
  equipo_visitante_id: { type: DataTypes.INTEGER, allowNull: false },
  estadio_id: { type: DataTypes.INTEGER, allowNull: false },
  fecha_hora: { type: DataTypes.DATE, allowNull: false },
  goles_local: { type: DataTypes.INTEGER },
  goles_visitante: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.STRING(20), defaultValue: 'PROGRAMADO' },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'partidos' });

const Pronostico = sequelize.define('Pronostico', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  partido_id: { type: DataTypes.INTEGER, allowNull: false },
  goles_local_pronosticado: { type: DataTypes.INTEGER, allowNull: false },
  goles_visitante_pronosticado: { type: DataTypes.INTEGER, allowNull: false },
  puntos_obtenidos: { type: DataTypes.INTEGER, defaultValue: 0 },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'pronosticos' });

const ClasificacionGrupo = sequelize.define('ClasificacionGrupo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  grupo_id: { type: DataTypes.INTEGER, allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  puntos_totales: { type: DataTypes.INTEGER, defaultValue: 0 },
  posicion: { type: DataTypes.INTEGER },
  fecha_actualizacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'clasificacion_grupo' });

Role.hasMany(Usuario, { foreignKey: 'rol_id' });
Usuario.belongsTo(Role, { foreignKey: 'rol_id', as: 'rol' });

Usuario.hasMany(Grupo, { foreignKey: 'creador_id', as: 'gruposCreados' });
Grupo.belongsTo(Usuario, { foreignKey: 'creador_id', as: 'creador' });

Usuario.belongsToMany(Grupo, { through: GrupoUsuario, foreignKey: 'usuario_id', otherKey: 'grupo_id', as: 'grupos' });
Grupo.belongsToMany(Usuario, { through: GrupoUsuario, foreignKey: 'grupo_id', otherKey: 'usuario_id', as: 'miembros' });

Grupo.hasMany(GrupoUsuario, { foreignKey: 'grupo_id', as: 'grupoUsuarios' });
GrupoUsuario.belongsTo(Grupo, { foreignKey: 'grupo_id', as: 'grupo' });
Usuario.hasMany(GrupoUsuario, { foreignKey: 'usuario_id', as: 'grupoUsuarios' });
GrupoUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Fase.hasMany(Partido, { foreignKey: 'fase_id', as: 'partidos' });
Partido.belongsTo(Fase, { foreignKey: 'fase_id', as: 'fase' });

Equipo.hasMany(Partido, { foreignKey: 'equipo_local_id', as: 'partidosLocal' });
Partido.belongsTo(Equipo, { foreignKey: 'equipo_local_id', as: 'equipoLocal' });
Equipo.hasMany(Partido, { foreignKey: 'equipo_visitante_id', as: 'partidosVisitante' });
Partido.belongsTo(Equipo, { foreignKey: 'equipo_visitante_id', as: 'equipoVisitante' });

Ciudad.hasMany(Estadio, { foreignKey: 'ciudad_id', as: 'estadios' });
Estadio.belongsTo(Ciudad, { foreignKey: 'ciudad_id', as: 'ciudad' });
Estadio.hasMany(Partido, { foreignKey: 'estadio_id', as: 'partidos' });
Partido.belongsTo(Estadio, { foreignKey: 'estadio_id', as: 'estadio' });

Usuario.hasMany(Pronostico, { foreignKey: 'usuario_id', as: 'pronosticos' });
Pronostico.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Partido.hasMany(Pronostico, { foreignKey: 'partido_id', as: 'pronosticos' });
Pronostico.belongsTo(Partido, { foreignKey: 'partido_id', as: 'partido' });

Grupo.hasMany(ClasificacionGrupo, { foreignKey: 'grupo_id', as: 'clasificaciones' });
ClasificacionGrupo.belongsTo(Grupo, { foreignKey: 'grupo_id', as: 'grupo' });
Usuario.hasMany(ClasificacionGrupo, { foreignKey: 'usuario_id', as: 'clasificaciones' });
ClasificacionGrupo.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

const defaultTeams = [
  { nombre: 'Argentina', codigo_fifa: 'ARG', grupo_mundial: 'A', bandera_url: 'https://flagcdn.com/w320/ar.png' },
  { nombre: 'Francia', codigo_fifa: 'FRA', grupo_mundial: 'A', bandera_url: 'https://flagcdn.com/w320/fr.png' },
  { nombre: 'Brasil', codigo_fifa: 'BRA', grupo_mundial: 'A', bandera_url: 'https://flagcdn.com/w320/br.png' },
  { nombre: 'Inglaterra', codigo_fifa: 'ENG', grupo_mundial: 'A', bandera_url: 'https://flagcdn.com/w320/gb-eng.png' },
  { nombre: 'España', codigo_fifa: 'ESP', grupo_mundial: 'B', bandera_url: 'https://flagcdn.com/w320/es.png' },
  { nombre: 'Alemania', codigo_fifa: 'GER', grupo_mundial: 'B', bandera_url: 'https://flagcdn.com/w320/de.png' },
  { nombre: 'Estados Unidos', codigo_fifa: 'USA', grupo_mundial: 'B', bandera_url: 'https://flagcdn.com/w320/us.png' },
  { nombre: 'México', codigo_fifa: 'MEX', grupo_mundial: 'B', bandera_url: 'https://flagcdn.com/w320/mx.png' },
  { nombre: 'Canadá', codigo_fifa: 'CAN', grupo_mundial: 'C', bandera_url: 'https://flagcdn.com/w320/ca.png' },
  { nombre: 'Portugal', codigo_fifa: 'POR', grupo_mundial: 'C', bandera_url: 'https://flagcdn.com/w320/pt.png' },
  { nombre: 'Italia', codigo_fifa: 'ITA', grupo_mundial: 'C', bandera_url: 'https://flagcdn.com/w320/it.png' },
  { nombre: 'Países Bajos', codigo_fifa: 'NED', grupo_mundial: 'C', bandera_url: 'https://flagcdn.com/w320/nl.png' },
  { nombre: 'Uruguay', codigo_fifa: 'URU', grupo_mundial: 'D', bandera_url: 'https://flagcdn.com/w320/uy.png' },
  { nombre: 'Colombia', codigo_fifa: 'COL', grupo_mundial: 'D', bandera_url: 'https://flagcdn.com/w320/co.png' },
  { nombre: 'Japón', codigo_fifa: 'JPN', grupo_mundial: 'D', bandera_url: 'https://flagcdn.com/w320/jp.png' },
  { nombre: 'Marruecos', codigo_fifa: 'MAR', grupo_mundial: 'D', bandera_url: 'https://flagcdn.com/w320/ma.png' },
];

const ensureDefaultTeams = async () => {
  const existingCount = await Equipo.count();
  if (existingCount > 0) {
    return Equipo.findAll({ order: [['nombre', 'ASC']] });
  }

  for (const team of defaultTeams) {
    await Equipo.findOrCreate({
      where: { codigo_fifa: team.codigo_fifa },
      defaults: team,
    });
  }

  return Equipo.findAll({ order: [['nombre', 'ASC']] });
};

const ensureDefaultPhases = async () => {
  const defaultPhases = [
    'Fase de grupos',
    'Dieciseisavos de final',
    'Octavos de final',
    'Cuartos de final',
    'Semifinal',
    'Tercer puesto',
    'Final',
  ];

  for (const nombre of defaultPhases) {
    await Fase.findOrCreate({
      where: { nombre },
      defaults: { nombre },
    });
  }

  return Fase.findAll({ order: [['id', 'ASC']] });
};

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await ensureDefaultTeams();
    await ensureDefaultPhases();
    console.log('Conexión a PostgreSQL con Sequelize establecida.');
  } catch (error) {
    console.error('Error al inicializar Sequelize:', error.message);
  }
};

initializeDatabase();

module.exports = {
  sequelize,
  Role,
  Usuario,
  Ciudad,
  Estadio,
  Equipo,
  Fase,
  Grupo,
  GrupoUsuario,
  Partido,
  Pronostico,
  ClasificacionGrupo,
  ensureDefaultTeams,
  ensureDefaultPhases,
};
