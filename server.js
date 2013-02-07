var http = require('http');
var redis = require('redis');
var connectRedis = require('connect-redis');
var express = require('express');
var socketio = require('socket.io');
var stylus = require('stylus');
var nib = require('nib');
var cnCoffeeScript = require('connect-coffee-script');
var utils = require('./utils');
//var moment = require('public/js/moment');

var MINUTE = 60000;
//two hour max age
var COOKIEMAXAGE = 2*60*MINUTE;

var RedisStore = connectRedis(express);
var app = express();
var server = http.createServer(app);

function compileStyl(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib());
}

//c9.io umento development settings
app.configure('development', function() {
  console.log("in development");
  app.set("umento_httpPort", process.env.PORT || 8080);
  app.set("umento_redisHost", "70.89.137.93");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
  var stylusOpts = {
    debug: true,
    src: __dirname + '/lib',
    dest: __dirname + '/public',
    compile: compileStyl
  };
  
  console.log("redis host: " + app.get("umento_redisHost"));
  console.log("redis port: " + app.get("umento_redisPort"));
  console.log("redis auth: " + app.get("umento_redisAuth"));
  
  var redisClient = redis.createClient(app.get("umento_redisPort"), app.get("umento_redisHost"));
  redisClient.auth(app.get("umento_redisAuth"));
  //dev database is 0, which is default
  var redisStore = new RedisStore({client: redisClient});
  
  main(stylusOpts, redisClient, redisStore);
});

//app fog umento.hp.af.cm production settings
app.configure('production', function() {
  console.log("in production");
  //var servicesEnv = JSON.parse(process.env.VCAP_SERVICES);
  //var redisCreds = servicesEnv["redis-2.2"][0].credentials;
  app.set("umento_httpPort", process.env.VCAP_APP_PORT);
  //app.set("umento_redisHost", redisCreds.host);
  //app.set("umento_redisPort", redisCreds.port);
  //app.set("umento_redisAuth", redisCreds.password);
  app.set("umento_redisHost", "70.89.137.93");
  app.set("umento_redisPort", 6379);
  app.set("umento_redisAuth", "cauVK8QGb5neYUKGnQrMyEIU");
  var stylusOpts = {
    src: __dirname + '/lib',
    dest: __dirname + '/public',
    compile: compileStyl
  };
  
  console.log("redis host: " + app.get("umento_redisHost"));
  console.log("redis port: " + app.get("umento_redisPort"));
  console.log("redis auth: " + app.get("umento_redisAuth"));
  
  var redisClient = redis.createClient(app.get("umento_redisPort"), app.get("umento_redisHost"));
  redisClient.auth(app.get("umento_redisAuth"));
  //change to the production database
  redisClient.select(1, function() {
    var redisStore = new RedisStore({client: redisClient});
  
    main(stylusOpts, redisClient, redisStore);
  });
  
  //set up a regular redis ping command to keep the connection open
  setInterval(function() {
    redisClient.ping();
  }, 30*MINUTE);
});

function main(stylusOpts, redisClient, redisStore) {
    
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
  app.use(stylus.middleware(stylusOpts));
  app.use(cnCoffeeScript({
   src: __dirname + '/lib',
   dest: __dirname + '/public'
  }));
  app.use(globalViewData);
  app.use(app.router);
  app.use(express.static(__dirname + '/public', {maxAge:86400}));
  
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
  
  var User = require('./models/user')(redisClient);
  var GameState = require('./public/js/gamestate');
  var gs = new GameState({w:60, h:34, logs:15});
  gs.initialize();
  //console.log(gs);
  
  server.listen(app.get("umento_httpPort"));
  var io = socketio.listen(server);
  io.set ('authorization', socketAuth);
  
  //redisClient settings
  redisClient.on("error", function(err){
    console.log("Redis Error: " + err);
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
  
  var noCacheResHeaders = {
    'Pragma':'no-cache',
    'Cache-Control':'s-maxage=0, max-age=0, must-revalidate, no-cache',
    'Expires':'0'
  };
    
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
  
  function renderAbout(req, res) {
    res.ViewData.title = "Monumentous - About";
    res.render("about", res.ViewData);
  }
  
  function renderGame(req, res) {
    res.ViewData.title = "Monumentous - Game";
    res.render("game", res.ViewData);
  }
  
  app.get("/", function(req, res) {
    renderHome(req, res);
  });
  
  app.get("/about", function(req, res) {
    renderAbout(req, res);
  });
  
  app.get("/game", function(req, res) {
    renderGame(req, res);
  });
  
  app.get('/gamestate.json', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(gs);
  });
  
  function socketAuth(handShakeData, accept) {
    // check if there's a cookie header
    if (handShakeData.headers.cookie) {
        // if there is, parse the cookie
        handShakeData.cookie = utils.cookie.parse(handShakeData.headers.cookie);
        handShakeData.sessionID = utils.parseSignedCookie(handShakeData.cookie['umento.sid'], cookieSecret);
        //handShakeData.sessionStore = redisStore;
        //console.log("socket auth handshake data -> ");
        //console.log(handShakeData);
        redisStore.load(handShakeData.sessionID, function(err, sess) {
          if (err || !sess) {
            //can't  get session information from the store
            return accept('session retrieval error', false);
          }
          //console.log("loaded session on socket authentication ->");
          //console.log(sess);
          handShakeData.session = sess;
          accept(null, true);
        });
    } else {
       // if there isn't, turn down the connection with a message
       // and leave the function.
       return accept('No cookie transmitted.', false);
    }
  }
  
  var userCount = 0;
  io.sockets.on("connection", function (socket) {
    //session stuff
    var hs = socket.handshake;
    // setup an interval that will keep our session fresh
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

    socket.join(hs.sessionID);
    
    if (io.sockets.clients(hs.sessionID).length === 1) {
      //new session
      userCount += 1;
    }
    io.sockets.emit("connectedUsers", {count: userCount});
    
    //listen for new user accounts
    socket.on("createAccount", function(data) {
      //make sure they aren't already signed in
      if (!hs.session.user && data.hasOwnProperty("username") && data.hasOwnProperty("password")) {
        var usrData = { username:data.username, password:data.password };
        if (data.hasOwnProperty("email") && typeof data.email === 'string' && data.email.length > 0) {
          usrData.email = data.email;
        }
        var user = new User(usrData);
        user.save(function(err, savedUser) {
          if (err || !savedUser) {
            console.log("could not create account ->");
            console.log(err);
            socket.emit("createAccount", {result:false});
          } else {
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
            //authenticated
            //hs.session.user = user;
            //hs.session.save();
            //socket.emit("login", {result:true, username:user.username});
            
            hs.session.regenerate(function(err) {
              if (err) {
                console.log("failed to regenerate user session");
                socket.emit("login", {result:false});
              } else {
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
    
    //listen for chat messages
    socket.on("chatMessage", function(data) {
      //if the user is logged in, override the nickname with the username
      var pushData = {
        nickname: data.nickname,
        message: data.message,
        ts: data.ts
      };
      if (hs.session.user) {
        pushData.nickname = hs.session.user.username;
      }
      
      redisClient.lpush("chatMessages", JSON.stringify(pushData), function(err, reply) {
        //redisClient.ltrim("chatMessages", 0, 19, function(err, reply) {
        //});
      });
      
      //the client already knows that it submitted a message, but the server may have overwritten some of it
      //  so we'll send the corrections back to that client so that it has the final copy
      (function() {
        pushData.index = data.index;
        socket.emit("chatCorrection", pushData); 
      })();
      
      //the other clients get the corrected data also as normal message emits
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
