//redisClient.flushdb();

//test user model
var scott = new User({username:'svickers', email:'sup@supmail.com', password:'sostrongpassword'});
scott.save(function(err, savedScott) {
  if (err) { return console.log(err); }
  console.log("Saved scott as ->");
  console.log(savedScott);
  
  redisClient.sismember("Users", savedScott.username, function(err, reply) {
    if (err) { return console.log(err); }
    console.log("is a member of Users set, " + reply);
    
    redisClient.get("User:" + savedScott.username + ":id", function(err, reply){
      if (err) { return console.log(err); }
      console.log("get id from username with User:{username}:id, " + reply);
      
      redisClient.hgetall("User:" + savedScott.id, function(err, obj){
        if (err) { return console.log(err); }
        console.log("hgetall ->");
        console.log(obj);
        
        savedScott.comparePassword("sostrongpassword", function(err, isMatch) {
          if (err) { return console.log(err); }
          console.log ("compared correct password, " + isMatch);
          
          savedScott.comparePassword("hiyosucka", function(err, isMatch) {
            if (err) { return console.log(err); }
            console.log("compared incorrect password, " + isMatch);
            
            User.findOne({username:'svickers'}, function(err, foundUser) {
              if (err) { return console.log(err); }
              console.log("Found user 'svickers' as ");
              console.log(foundUser);
              
              User.Remove(foundUser.id, function(err, reply) {
                if (err) { return console.log(err); }
                console.log("Removed user with id " + foundUser.id);
                
                redisClient.sismember("Users", foundUser.username, function(err, reply){
                  if (err) { return console.log(err); }
                  console.log("is a member of Users set, " + reply);
                  
                  redisClient.get("User:" + foundUser.username + ":id", function (err, reply) {
                    if (err) { return console.log(err); }
                    console.log("get id from username with User:{username}:id, " + reply);
                    
                    redisClient.hgetall("User:" + foundUser.id, function(err, obj) {
                      if (err) { return console.log(err); }
                      console.log("hgetall ->");
                      console.log(obj);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});