var httpPort = process.env.PORT || 8080;
var httpHost = process.env.IP;
var redisPort = 6379;
var redisHost = "umento.us";

var http = require('http');
var redis = require('redis');
var express = require('express');
var socketio = require('socket.io');

var redisClient = redis.createClient(redisPort, redisHost);
redisClient.auth("cauVK8QGb5neYUKGnQrMyEIU");

var app = express();
var server = http.createServer(app);
server.listen(httpPort, httpHost);
var io = socketio.listen(server);

app.set('title', 'Try Umento');
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/lib/js'));

var templateArgs = {
  "title": "Umento"
};

app.get("/", function(req, res) {
  res.render("home/default", templateArgs);
});

io.sockets.on("connection", function (socket) {
  
  socket.on("SetVal", function(data) {
    redisClient.set("mykey", data.val);
    io.sockets.emit("DataChanged", {redisVal: data.val});
  });
  
  redisClient.get("mykey", function(err, reply) {
    socket.emit("ClientConnected", { redisVal: reply });
  });
});