var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('user', {
    id: { type: 'int', primaryKey:true, autoIncrement:true },
    username:'string',
    email:'string',
    password:'string',
    createdAt:'datetime',
    updatedAt:'datetime'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('user', callback);
};