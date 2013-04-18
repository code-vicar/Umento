var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
  db.createTable('chatmessage', {
    id: { type: 'int', primaryKey:true, autoIncrement:true },
    nickname:'string',
    message:'string',
    ts:'datetime'
  }, callback);
};

exports.down = function(db, callback) {
  db.dropTable('chatmessage', callback);
};