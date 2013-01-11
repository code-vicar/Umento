var http = require('http');
var redis = require('redis');
var express = require('express');
var socketio = require('socket.io');
var stylus = require('stylus');
var nib = require('nib');
var cnCoffeeScript = require('connect-coffee-script');
//var moment = require('public/js/moment');

var app = express();
var server = http.createServer(app);

function compileStyl(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}

var stylusMiddlewareOptions;

//c9.io umento development settings
app.configure('development', function() {
  console.log("in development");
  app.set("umento_httpPort", process.env.PORT || 8080);
  app.set("umento_redisHost", "70.89.137.93");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
  stylusMiddlewareOptions = {
    debug: true,
    src: __dirname + '/lib',
    dest: __dirname + '/public',
    compile: compileStyl
  };
});

//app fog umento.hp.af.cm production settings
app.configure('production', function() {
  console.log("in production");
  var servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
  var redisCreds = servicesEnv["redis-2.2"][0].credentials;
  app.set("umento_httpPort", process.env.VCAP_APP_PORT);
  app.set("umento_redisHost", redisCreds.host);
  app.set("umento_redisPort", redisCreds.port);
  app.set("umento_redisAuth", redisCreds.password);
  stylusMiddlewareOptions = {
    src: __dirname + '/lib',
    dest: __dirname + '/public',
    compile: compileStyl
  };
});

//general configurations
app.configure(function() {
  app.set('title', 'Try Umento');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  app.use(stylus.middleware(stylusMiddlewareOptions));
  
  app.use(cnCoffeeScript({
   src: __dirname + '/lib',
   dest: __dirname + '/public'
  }));
  
  app.use(express.static(__dirname + '/public'));
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
    'xhr-polling'
  ]);
});

var noCacheResHeaders = {
  'Pragma':'no-cache',
  'Cache-Control':'s-maxage=0, max-age=0, must-revalidate, no-cache',
  'Expires':'0'
};

function renderHome(req, res) {
  redisClient.lrange("chatMessages", 0, -1, function(err, reply) {
    reply = reply ? reply : [];
    var msgs = [];
    reply.forEach(function(msg){
      msgs.unshift(JSON.parse(msg));
    });
    res.set(noCacheResHeaders);
    res.render("default", {
      "title": "Umento",
      "StartVal": JSON.stringify({messages:msgs})
    });
  });
}

function renderAbout(req, res) {
  res.render("about", {
    "title":"Umento - About"
  });
}

app.get("/", function(req, res) {
  renderHome(req, res);
});

app.get("/default", function(req, res) {
  renderHome(req, res);
});

app.get("/about", function(req, res) {
  renderAbout(req, res);
});

var userCount = 0;
io.sockets.on("connection", function (socket) {
  userCount += 1;
  
  io.sockets.emit("connectedUsers", {count: userCount});
  
  //listen for "SetVal" emits from the client
  socket.on("chatMessage", function(data) {
    redisClient.lpush("chatMessages", JSON.stringify(data), function(err, reply) {
      redisClient.ltrim("chatMessages", 0, 9, function(err, reply) {
      });
    });
    
    socket.broadcast.emit("chatMessage", data);
  });
  
  socket.on("disconnect", function() {
    userCount = ((userCount - 1) < 0) ? 0 : userCount - 1;
    
    io.sockets.emit("connectedUsers", {count: userCount});
  });
});