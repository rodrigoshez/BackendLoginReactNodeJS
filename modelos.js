const sequelize = require('./sequelize');
const { DataTypes } = require('sequelize');

const Login = sequelize.define('Login', {
  idLOGIN: {
    type: DataTypes.INTEGER,
    primaryKey: true,   
    autoIncrement: true
  },
  USERNAME: {
    type: DataTypes.STRING,
    allowNull: false
  },
  PASSWORD: {
    type: DataTypes.STRING,
    allowNull: false
  },
  TIPOUSUARIO: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'login',
  timestamps: false
});

const Audio = sequelize.define('Audio', {
  id_audio: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombreAudio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  archivoMultimedia: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'audios', 
  timestamps: false,   
});

module.exports = {Login, Audio};