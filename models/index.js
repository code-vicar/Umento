var bcrypt = require('bcryptjs');
var SALT_WORK_FACTOR = 10;
var dbSettings = require("../database.json");

var db = dbSettings.dev
if (process.env.NODE_ENV === "production") {
  db = dbSettings.prod
}

var Schema = require("jugglingdb").Schema;
debugger;
var schema = new Schema("mysql", {
  host: db.host,
  database: db.database,
  username: db.user,
  password: db.password
});

var User = schema.define("User", {
  username: String,
  email: String,
  password: String,
  createdAt: Date,
  updatedAt: Date
});

var ChatMessage = schema.define("ChatMessage", {
  nickname: String,
  message: String,
  ts: Date
});

User.validatesLengthOf("username", {min:3, message:{min:"Usernames must be at least 3 characters"}});
User.validatesLengthOf("password", {min:8, message:{min:"Passwords must be at least 8 characters"}});
User.validatesUniquenessOf("username");

ChatMessage.validatesPresenceOf("nickname");
ChatMessage.validatesPresenceOf("message");
ChatMessage.validatesPresenceOf("ts");

//encrypt the password before creating a new user
User.beforeCreate = function(next, data) {
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if (err) {
      throw err;
    }
    bcrypt.hash(data.password, salt, function(err, hash) {
      if (err) {
        throw err;
      }
      data.password = hash;
      next();
    });
  });
};

//check here for error code descriptions
//https://dev.twitter.com/docs/error-codes-responses

User.Authenticate = function(username, password, cb) {
  User.all({where:{username:username}}, function(err, usrs) {
    if (err) {
      return cb({errors:[{code:131, message:"Error in User.all"}]});
    }
    if (usrs.length != 1) {
      return cb({errors:[{code:215, message:"Validation errors"}]});
    }

    //found the user, now compare the password
    bcrypt.compare(password, usrs[0].password, function(err, isMatch) {
      if (err) {
        return cb({errors:[{code:131, message:"Server error"}]});
      }
      //return null if user didn't authenticate correctly
      if (!isMatch) {
        return cb({errors:[{code:215, message:"Validation errors"}]}, null);
      }
      //otherwise return the user
      cb(null, usrs[0]);
    });
  });
};

module.exports.User = User;
module.exports.ChatMessage = ChatMessage;
