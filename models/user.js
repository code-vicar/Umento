(function() {
  
  exports = module.exports = wrapper;
  
  function wrapper(db) { return new UserFactory(db); }
  
  function UserFactory(db) {
    
    this.User = function(props) {
      //defaults
      this.username = "";
      this.email = "";
      this.password = "";
      
      //create properties from the object passed in the constuctor
      for (var key in props) {
        if (typeof props[key] !== 'Object' && typeof props[key] !== 'function' && props[key] !== null) {
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
    
    this.User.prototype.comparePassword = function(pass, cb) {
      if (pass !== "hiya")
      {
       return cb("err");
      }
      return cb(null, this);
    };
    
    this.User.prototype.save = function(cb) {
      var me = this;
      if (typeof me.id !== 'number' || me.id <= 0) {
        return cb("Invalid or missing ID");
      }
      
      if (typeof me.username !== 'string' || me.username.length <= 0) {
        return cb("Invalid or missing username");
      }
    
      db.hexists("User:" + me.id, "username", function (err, reply) {
        if (err) { return cb(err); }
        if (reply === 0)
        {
          return cb("A user with that ID does not exist");
        }
        var userPropArr = ["User:" + me.id];
        for (var key in me)
        {
          if (typeof me[key] !== 'object' && typeof me[key] !== 'function' && me[key] !== null)
          {
            userPropArr.push(me[key]);
            userPropArr.push(key);
          }
        }
        if (userPropArr.length > 1) {
          //use hmset to set the field values in this user's redis hash
          db.hmset(userPropArr, function(err, reply) {
            if (err) { return cb(err); }
            
            return cb(null, me);
          });
        } else {
          return cb("Cannot save a user with no properties");
        }
      });
    };
    
    this.Create = function(username, email, password, cb) {
      
      return null;
    };
    
    this.Remove = function(id, cb) {
      if (typeof id !== 'number' || id <= 0) {
        return cb("Invalid ID");
      }
      
      //check if this user already exists in the database
      db.hexists("User:" + id, "username", function (err, reply) {
        if (err) { return cb(err); }
        if (reply === 0)
        {
          return cb(null, "Didn't exist");
        }
        db.del("User:" + id, function(err, reply){
          if (err) { return cb(err); }
          return cb(null, reply);
        });
      });
    };
    
    this.findOne = function(username, cb) {
      var usr = new this.User({username:username, email:'sv@blah.com', password:'hiya'});
      //TODO: get user from db using username
      //if ('not found')
      //{
      //  return cb('err');
      //}
      return cb(null, usr);
    };
  }
})();