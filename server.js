var http = require('http');
var redis = require('redis');
var connectRedis = require('connect-redis');
var express = require('express');
var socketio = require('socket.io');
//var stylus = require('stylus');
//var nib = require('nib');
var utils = require('./utils');
//var moment = require('public/js/moment');

var MINUTE = 60000;
//two hour max age
var COOKIEMAXAGE = 2*60*MINUTE;

var RedisStore = connectRedis(express);
var app = express();
var server = http.createServer(app);

//c9.io umento development settings
app.configure('development', function() {
  console.log("in development");
  app.set("umento_httpPort", process.env.PORT || 8080);
  app.set("umento_redisHost", "70.89.137.93");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
    
  console.log("redis host: " + app.get("umento_redisHost"));
  console.log("redis port: " + app.get("umento_redisPort"));
  console.log("redis auth: " + app.get("umento_redisAuth"));
  
  var redisClient = redis.createClient(app.get("umento_redisPort"), app.get("umento_redisHost"));
  redisClient.auth(app.get("umento_redisAuth"));
  //dev database is 0, which is default
  var redisStore = new RedisStore({client: redisClient});
  
  main(redisClient, redisStore);
});

//app fog umento.hp.af.cm production settings
app.configure('production', function() {
  console.log("in production");
  app.set("umento_httpPort", process.env.VCAP_APP_PORT);
  app.set("umento_redisHost", "70.89.137.93");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
    
  console.log("redis host: " + app.get("umento_redisHost"));
  console.log("redis port: " + app.get("umento_redisPort"));
  console.log("redis auth: " + app.get("umento_redisAuth"));
  
  var redisClient = redis.createClient(app.get("umento_redisPort"), app.get("umento_redisHost"));
  redisClient.auth(app.get("umento_redisAuth"));
  //change to the production database
  redisClient.select(1, function() {
    var redisStore = new RedisStore({client: redisClient});
  
    main(redisClient, redisStore);
  });
  
  //set up a regular redis ping command to keep the connection open
  setInterval(function() {
    redisClient.ping();
  }, 30*MINUTE);
});

function main(redisClient, redisStore) {
  //log errors from the redis database
  redisClient.on("error", function(err){
    console.log("Redis Error: " + err);
  });
  
  //general configurations
  app.set('title', 'Try Umento');
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  
  //express middleware
  var cookieSecret = 'vt0EIiMDWtCShAtq';
  app.use(express.favicon(__dirname + '/favicon.ico'));
  app.use(express.logger());
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    secret: cookieSecret,
    key: 'umento.sid',
    store: redisStore,
    cookie: { path:'/', httpOnly:true, maxAge:COOKIEMAXAGE }
  }));
  app.use(require('connect-assets')({src:'lib', buildDir:'public'}));
  app.use(globalViewData);
  app.use(app.router);
  app.use(express.static(__dirname + '/public', {maxAge:86400}));
  
  //set up a custom 404 response
  app.use(function(req, res, next) {
    res.status(404);
    
    if (req.accepts('html')) {
      res.render('404', { url:req.url, layout:false });
      return;
    }
    
    if (req.accepts('json')) {
      res.send({error: 'Not found' });
      return;
    }
    
    res.type('txt').send('Not found');
  });
  
  //set up variables for accessing the User, and Gamestate models
  var User = require('./models/user')(redisClient);
  var GameState = require('./public/js/gamestate');
  
  //construct and initialize the gamestate
  var gs = new GameState({w:60, h:34, logs:15});
  gs.initialize();
  
  //start the http server listening for requests
  server.listen(app.get("umento_httpPort"));
  
  //start the socketio framework listening to the http server
  var io = socketio.listen(server);
  
  //set up an authorization method to be called each time a new socket connection is attempted
  io.set ('authorization', function(handShakeData, accept) {
    // check if there's a cookie header
    if (handShakeData.headers.cookie) {
        // if there is, parse the cookie
        handShakeData.cookie = utils.cookie.parse(handShakeData.headers.cookie);
        //get the sessionID from the cookie. (it must be stored in a variable named "sessionID" on the handshake object)
        handShakeData.sessionID = utils.parseSignedCookie(handShakeData.cookie['umento.sid'], cookieSecret);
        //retrieve the session store object using the sessionID from the cookie
        redisStore.load(handShakeData.sessionID, function(err, sess) {
          if (err || !sess) {
            //can't  get session information from the store
            //deny the socket connection with a message
            return accept('session retrieval error', false);
          }
          //keep a reference to the session in a "session" variable on the handshake object
          handShakeData.session = sess;
          //allow the socket connection
          accept(null, true);
        });
    } else {
       // if there isn't, deny the socket connection with a message
       return accept('No cookie transmitted.', false);
    }
  });
  
  //socket.io settings
  io.configure(function() {
    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    
    //enabled transports (removed websocket since AppFog doesn't support it yet)
    io.set('transports', [
      'xhr-polling'
    ]);
  });
  
  //prepare headers for use in requests that shouldn't be cached
  var noCacheResHeaders = {
    'Pragma':'no-cache',
    'Cache-Control':'s-maxage=0, max-age=0, must-revalidate, no-cache',
    'Expires':'0'
  };
    
  //create a function called on every request to build a common ViewData object
  function globalViewData(req, res, next) {
    res.ViewData = res.ViewData || {};
    res.ViewData.username = ""; 
    if (req.session.user) {
      res.ViewData.username = req.session.user.username;
      //console.log("global req ->");
      //console.log(res.ViewData);
    }
    next();
  }
  
  //create the function that renders the home page
  function renderHome(req, res) {
    res.ViewData.title = "Monumentous";
    //req.session.views = req.session.views || 0;
    //req.session.views = req.session.views + 1;
    //console.log("request session ->");
    //console.log(req.session);
    //console.log("view data ->");
    //console.log(res.ViewData);
    console.log(req.session);
    redisClient.lrange("chatMessages", 0, 19, function(err, reply) {
      reply = reply ? reply : [];
      var msgs = [];
      reply.forEach(function(msg){
        msgs.unshift(JSON.parse(msg));
      });
      res.set(noCacheResHeaders);
      res.ViewData.messages = JSON.stringify(msgs);
      res.render("default", res.ViewData);
    });
  }
  
  //create the function that renders the about page
  function renderAbout(req, res) {
    res.ViewData.title = "Monumentous - About";
    res.render("about", res.ViewData);
  }
  
  //create the function that renders the game page
  function renderGame(req, res) {
    res.ViewData.title = "Monumentous - Game";
    res.render("game", res.ViewData);
  }
  
  //handle application root request
  app.get("/", function(req, res) {
    renderHome(req, res);
  });
  
  //handle about page request
  app.get("/about", function(req, res) {
    renderAbout(req, res);
  });
  
  //handle game page request
  app.get("/game", function(req, res) {
    renderGame(req, res);
  });
  
  //handle gamestate json request
  app.get('/gamestate.json', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(gs);
  });
  
  //keep track of connected socket clients using the "userCount" variable
  var userCount = 0;
  //set up a function to be called each time a socket connection is established
  io.sockets.on("connection", function (socket) {
    //store a reference to the handshake object for convenience
    var hs = socket.handshake;
    // setup an interval that will keep the session fresh
    var intervalID = setInterval(function () {
        // reload the session (just in case something changed,
        // we don't want to override anything, but the age)
        // reloading will also ensure we keep an up2date copy
        // of the session with our connection.
        hs.session.reload( function () { 
            // "touch" it (resetting maxAge and lastAccess)
            // and save it back again.
            hs.session.touch().save();
        });
    }, 60 * 1000);

    //track socket connections via their sessionID
    //  multiple socket connections with the same sessionID go into the same "room"
    socket.join(hs.sessionID);
    
    //after the socket joins it's sessionID room check the number of sockets in that room
    if (io.sockets.clients(hs.sessionID).length === 1) {
      //if there is only one, then it is a new user (or a new browser, or they cleared their cookies and opened a new tab, or something like that)
      userCount += 1;
    }
    
    //broadcast to all connected sockets how many connections their.
    //  we send the information to all sockets.
    //  a newly connected client will still need this information, even if it hasn't changed
    io.sockets.emit("connectedUsers", {count: userCount});
    
    //listen for new user accounts
    socket.on("createAccount", function(data) {
      //make sure they aren't already signed in
      if (!hs.session.user && data.hasOwnProperty("username") && data.hasOwnProperty("password")) {
        var usrData = { username:data.username, password:data.password };
        if (data.hasOwnProperty("email") && typeof data.email === 'string' && data.email.length > 0) {
          usrData.email = data.email;
        }
        //generate the new user in a model
        var user = new User(usrData);
        //save the model to redis
        user.save(function(err, savedUser) {
          if (err || !savedUser) {
            console.log("could not create account ->");
            console.log(err);
            socket.emit("createAccount", {result:false});
          } else {
            //set the user session to this newly created user
            hs.session.user = savedUser;
            hs.session.save();
            socket.emit("createAccount", {result:true, username:savedUser.username});
          }
        });
      }
    });
    
    //listen for login attempts
    socket.on("login", function(data) {
      //make sure they aren't already signed in and the necessary data is available
      if (!hs.session.user && data.hasOwnProperty("username") && data.hasOwnProperty("password")) {
        //check their credentials
        User.Authenticate(data.username, data.password, function(err, user) {
          if (err || !user) {
            socket.emit("login", {result:false});
          } else {
            //the credentials were authentic
            // give this user a new sessionID
            hs.session.regenerate(function(err) {
              if (err) {
                console.log("failed to regenerate user session");
                socket.emit("login", {result:false});
              } else {
                //store the signed in user information in the session
                hs.session.user = user;
                hs.session.save();
                //console.log(hs.session);
                socket.emit("login", {result:true, username:user.username});
              }
            });
          }
        });
      } else {
        socket.emit("login", {result:false});
      }
    });
    
    //listen for a chat message
    socket.on("chatMessage", function(data) {
      
      //set up the data that will be stored in redis
      var pushData = {
        nickname: data.nickname,
        message: data.message,
        ts: data.ts
      };
      
      //if the user is logged in, override the nickname with the username
      if (hs.session.user) {
        pushData.nickname = hs.session.user.username;
      }
      
      // serialize the data and push it onto the end of the chatMessages list
      redisClient.lpush("chatMessages", JSON.stringify(pushData), function(err, reply) {
      });
      
      //the client already knows that it submitted a message, but the server may have overwritten some of it
      //  so we'll send the corrections back to that client so that it has the final copy
      //  p.s. the client that emitted the message included an index
      //   create a new response object for the originating client and put the index on it so it knows which message to correct
      var dataCorrection = pushData;
      dataCorrection.index = data.index;
      socket.emit("chatCorrection", dataCorrection); 
      
      //the other clients don't need the index information, so send them the data without it
      socket.broadcast.emit("chatMessage", pushData);
    });
    
    //listen for socket disconnections
    socket.on("disconnect", function() {
      //prevent memory leak by removing the interval that was refreshing this socket's session while it was connected
      clearInterval(intervalID);
      
      //make sure the socket has left the session room
      socket.leave(hs.sessionID);
      //check the room for other sockets, if this was the last browser with that session then decrement the user count
      if (io.sockets.clients(hs.sessionID).length === 0) {
        userCount = ((userCount - 1) < 0) ? 0 : userCount - 1;
      }
      io.sockets.emit("connectedUsers", {count: userCount});
    });
  });
}
