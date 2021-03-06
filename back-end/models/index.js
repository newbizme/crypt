'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(__filename);
var db        = {};

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: CONFIG.db_dialect,
  dialectOptions: {
    ssl: (process.env.DB_USE_SSL || 'false') == 'true'
  },
  operatorsAliases: false,
  //only log sql queries on local deploy
  logging: process.env.NODE_ENV == 'dev'? console.log : false
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    console.log('Importing model file: %s', file);
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
