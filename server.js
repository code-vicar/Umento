var httpPort = process.env.PORT || 8080;
var httpHost = process.env.IP;
var redisPort = 6379;
var redisHost = "umento.us";

var http = require('http');
var redis = require('redis');
var redisClient = redis.createClient(redisPort, redisHost);
redisClient.auth("cauVK8QGb5neYUKGnQrMyEIU");

http.createServer(function(req, res) {
    redisClient.set("mykey", "value2");
    
    res.writeHead(200, {'Content-Type':'text/plain'});
    res.end('Hello World\n');
}).listen(httpPort, httpHost);