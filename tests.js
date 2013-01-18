var redis = require('redis');
var redisClient = redis.createClient(6379, "70.89.137.93");
redisClient.auth("cauVK8QGb5neYUKGnQrMyEIU");
redisClient.flushdb();

//test user model
var User = require('./models/user')(redisClient);
var scott = new User({username:'svickers', email:'sup@supmail.com', password:'sostrongpassword'});

scott.save(function(err, savedScott) {
  if (err) { return console.log(err); }

  PrintUserInfo(err, savedScott, 'sostrongpassword', function(err, reply) {
    User.findOne({username:'svickers'}, function(err, foundUser) {
      if (err) { return console.log(err); }
      console.log("Found user 'svickers' as ->");
      console.log(foundUser);
      
      foundUser.email = "newEmail@meanstreets.com";
      foundUser.crazyNewAttribute = 1337;
      
      foundUser.save(function(err, savedFoundUser) {
        if (err) { return console.log(err); }
        
        PrintUserInfo(err, savedFoundUser, 'sostrongpassword', function(err, reply) {
          if (err) { return console.log(err); }
          
          User.Remove(savedFoundUser.id, function(err, reply) {
            if (err) { return console.log(err); }
            console.log("Removed user with id " + savedFoundUser.id);
            
            PrintUserInfo(null, savedFoundUser, 'sostrongpassword', function(err, reply){
              if (err) { return console.log(err); }
              
              console.log(reply);
            });
          });
        });
      });
    });
  });
});

function PrintUserInfo(err, usr, pass, cb) {
  if (err) { return console.log(err); }
  console.log("User scott as ->");
  console.log(usr);
  
  redisClient.sismember("Users", usr.username, function(err, reply) {
    if (err) { return console.log(err); }
    console.log("is a member of Users set, " + reply);
    
    redisClient.get("User:" + usr.username + ":id", function(err, reply){
      if (err) { return console.log(err); }
      console.log("get id from username with User:{username}:id, " + reply);
      
      redisClient.hgetall("User:" + usr.id, function(err, obj){
        if (err) { return console.log(err); }
        console.log("hgetall ->");
        console.log(obj);
        
        usr.comparePassword(pass, function(err, isMatch) {
          if (err) { return console.log(err); }
          console.log ("compared correct password, " + isMatch);
          
          usr.comparePassword("hiyosucka", function(err, isMatch) {
            if (err) { return console.log(err); }
            console.log("compared incorrect password, " + isMatch);
            cb(null, usr);
          });
        });
      });
    });
  });
}