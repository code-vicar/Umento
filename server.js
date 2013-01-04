var http = require('http');
var redis = require('redis');
var express = require('express');
var socketio = require('socket.io');

var app = express();
var server = http.createServer(app);

app.configure(function() {
  app.set('title', 'Try Umento');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');  
});

//c9.io umento development settings
app.configure('development', function() {
  console.log("in development");
  app.set("umento_httpPort", process.env.PORT || 8080);
  app.set("umento_redisHost", "umento.us");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
});

//app fog umento.hp.af.cm production settings
app.configure('production', function() {
  console.log("in production");
  var servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
  var redisCreds = servicesEnv["redis-2.2"][0]["credentials"];
  app.set("umento_httpPort", process.env.VCAP_APP_PORT);
  app.set("umento_redisHost", redisCreds.host);
  app.set("umento_redisPort", redisCreds.port);
  app.set("umento_redisAuth", redisCreds.password);
});

console.log("redis host: " + app.get("umento_redisHost"));
console.log("redis port: " + app.get("umento_redisPort"));
console.log("redis auth: " + app.get("umento_redisAuth"));

var redisClient = redis.createClient(app.get("umento_redisPort"), app.get("umento_redisHost"));
redisClient.auth(app.get("umento_redisAuth"));
server.listen(app.get("umento_httpPort"));
var io = socketio.listen(server);

//redisClient settings
redisClient.on("error", function(err){
  console.log("Redis Error: " + err);
});

//socket.io settings
io.configure('production', function() {
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  
  //enabled transports (removed websocket since AppFog doesn't support it yet)
  io.set('transports', [
      'flashsocket'
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
  ]);
});

app.use(express.static(__dirname + '/lib/js'));

app.get("/", function(req, res) {
  redisClient.get("mykey", function(err, reply) {
    
    res.set({
      'Pragma':'no-cache',
      'Cache-Control':'s-maxage=0, max-age=0, must-revalidate, no-cache',
      'Expires':'0'
    });
    
    res.render("home/default", {
      "title": "Umento",
      "StartVal": reply
    });
    
  });
});

io.sockets.on("connection", function (socket) {
  
  //listen for "SetVal" emits from the client
  socket.on("SetVal", function(data) {
    console.log("set mykey '" + data.val + "'");
    redisClient.set("mykey", data.val);
    
    redisClient.get("mykey", function(err, reply) {
      io.sockets.emit("DataChanged", { val: reply });  
    });
  });

});

