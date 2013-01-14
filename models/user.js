(function() {
  
  var bcrypt = require('../node_modules/bcrypt');
  var SALT_WORK_FACTOR = 10;
  var MIN_USERNAME_LENGTH = 3;
  var MIN_PASSWORD_LENGTH = 8;
  
  exports = module.exports = function(db) {
    
    var User = function(props) {
      //defaults
      this.id = 0;
      this.username = "";
      this.password = "";
      this.email = "";
      
      //create properties from the object passed to the constuctor
      for (var key in props) {
        if (props.hasOwnProperty(key) && typeof props[key] !== 'Object' && typeof props[key] !== 'function' && props[key] !== null) {
          if (!this.hasOwnProperty(key)){
            Object.defineProperty(
              this,
              key,
              Object.getOwnPropertyDescriptor(props, key)
            );
          } else {
            this[key] = props[key];
          }
        }
      }
    };
    
    User.prototype.comparePassword = function(pass, cb) {
      var me = this;
      
      if (!me.hasOwnProperty('id') || typeof me.id !== 'number' || me.id <= 0) {
        return cb("Invalid or missing ID");
      }
      if (!me.hasOwnProperty('password') || typeof me.password !== 'string' || me.password < MIN_PASSWORD_LENGTH) {
        return cb("Invalid or missing password");
      }
      
      if (!me.hasOwnProperty('username') || typeof me.username !== 'string' || me.username < MIN_USERNAME_LENGTH) {
        return cb("Invalid or missing username");
      }
      
      db.sismember("Users", me.username, function(err, reply) {
        if (err) { return cb(err); }
        
        if (reply === 0)
        {
          return cb("No such user");
        }
        
        //user exists in the database
        bcrypt.compare(pass, me.password, function(err, isMatch) {
          if (err) { return cb(err); }
          cb(null, isMatch);
        });
      });
    };
    
    User.prototype.toJSON = function(excludeID, convertToStrings) {
      var ret = {};
      for (var key in this)
      {
        if ((key !== 'id' || !excludeID) && this.hasOwnProperty(key) && typeof this[key] !== 'object' && typeof this[key] !== 'function' && this[key] !== null)
        {
          //turn all values into string, redis_node issue with hmset
          if (typeof this[key] !== 'string' && convertToStrings) {
            this[key] = this[key].toString();
          }
          
          Object.defineProperty(
            ret,
            key,
            Object.getOwnPropertyDescriptor(this, key)
          );
        }
      }
      return ret;
    };
    
    User.prototype.save = function(cb) {
      var me = this;
      
      //validate required params
      if (!me.hasOwnProperty('username') || typeof me.username !== 'string' || me.username.length < MIN_USERNAME_LENGTH) {
        return cb("Invalid or missing username");
      }
      
      if (!me.hasOwnProperty('password') || typeof me.password !== 'string' || me.password.length < MIN_PASSWORD_LENGTH) {
        return cb("Invalid or missing password");
      }
      
      //actual saving portion, will call this asynchronously
      var _save = function(obj, cb) {
        if (Object.keys(obj).length > 1) {
          //use hmset to set the field values in this user's redis hash
          db.hmset("User:" + me.id, obj, function(err, reply) {
            if (err) { return cb(err); }
            
            return cb(null, me);
          });
        } else {
          return cb("Cannot save a user with no properties");
        }
      };
      
      var _incAndSave = function(cb) {
        db.incr("global:User:id", function(err, newID) {
          if (err) { return cb(err); }
          me.id = newID;
          //bcrypt password
          bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
            if (err) { return cb(err); }
            bcrypt.hash(me.password, salt, function(err, hash) {
              if (err) { return cb(err); }
              
              me.password = hash;
              var usrJSON = me.toJSON(true, true);
              db.sadd("Users", me.username);
              db.set("User:" + me.username + ":id", me.id);
              _save(usrJSON, cb);
            });
          });
        });
      };
      
      var _update = function(cb){
        //can't update the password or the username here
        var usrJSON = me.toJSON(true, true);
        delete usrJSON.password;
        delete usrJSON.username;
        _save(usrJSON, cb);
      };
      
      var _create = function(cb) {
        db.get("global:User:id", function(err, reply) {
          if (err) { return cb(err); }
          if (reply === null)
          {
            db.set("global:User:id", 0, function(err, reply) {
              if (err) { return cb(err); }
              _incAndSave(cb);
            });
          } else {
            _incAndSave(cb);
          }
        });
      };
      
      db.sismember("Users", me.username, function(err, reply) {
        if (err) { return cb(err); }
        if (reply === 1) {
          db.get("User:" + me.username + ":id", function(err, reply) {
            if (err) { return cb(err); }
            if (reply === null) { return cb("Can't find id for user '" + me.username + "'"); }
            me.id = parseInt(reply, 10);
            _update(cb);
          });
        } else {
          _create(cb);
        }
      });
    };
    
    User.Remove = function(id, cb) {
      if (typeof id !== 'number' || id <= 0) {
        return cb("Invalid ID");
      }
      
      //check if this user already exists in the database
      db.hget("User:" + id, "username", function (err, reply) {
        if (err) { return cb(err); }
        if (reply === null)
        {
          return cb(null, "Didn't exist");
        }
        
        db.srem("Users", reply);
        db.del("User:" + reply + ":id", "User:" + id);
        cb(null, "Ok");
      });
    };
    
    User.findOne = function(props, cb) {
      
      var _load = function(id, cb) {
        db.hgetall("User:" + id, function(err, obj){
          if (err) { return cb(err); }
          obj.id = parseInt(id, 10);
          cb(null, new User(obj));
        });
      };
      
      if (typeof props === 'object') {
        if (props.hasOwnProperty('id') && typeof props.id === 'number') {
          db.hexists("User:" + props.id, "username", function(err, reply) {
            if (err) { return cb(err); }
            if (reply === 0)
            {
              return cb("User " + props.id + " not found");
            }
            _load(props.id, cb);
          });
        } else if (props.hasOwnProperty('username') && typeof props.username === 'string') {
          db.get("User:" + props.username + ":id", function(err, reply) {
            if (err) { return cb(err); }
            if (reply === null) { return cb("User '" + props.username + "' not found"); }
            var usrID = reply;
            db.hexists("User:" + usrID, "username", function(err, reply) {
              if (err) { return cb(err); }
              if (reply === 0)
              {
                return cb("User " + usrID + " not found");
              }
              _load(usrID, cb);
            });
          });
        } else {
          cb("Incorrect arguments, pass an object with a key of id, or username");
        }
      } else {
        cb("Incorrect arguments, pass an object with a key of id, or username");
      }
    };
    
    return User;
  };
  
})();