require('coffee-script');
var http = require('http');
var mysql = require('mysql');
var connectMysql = require('connect-mysql');
var express = require('express');
var socketio = require('socket.io');
var utils = require('./utils');
var UUIDGen = require('node-uuid');
var dbSettings = require("./database.json");
var Models = require("./models/");

var MINUTE = 60000;
//two hour max age
var COOKIEMAXAGE = 2*60*MINUTE;

var MySqlStore = connectMysql(express);
var app = express();
var server = http.createServer(app);

//set a debug variable so we know
// if we want to send non-uglified code to the client
var debug = true;
var serverPort = 8080;

//dev settings
app.configure('development', function() {
  console.log("in development");

  var mysqlClient = mysql.createConnection(dbSettings.dev);
  var mysqlStore = new MySqlStore({client: mysqlClient});

  main(mysqlClient, mysqlStore);
});

//prod settings
app.configure('production', function() {
  console.log("in production");
  debug = false;
  serverPort = 2080;
  
  var mysqlClient = mysql.createConnection(dbSettings.prod);
  var mysqlStore = new MySqlStore({client: mysqlClient});
  
  main(mysqlClient, mysqlStore);
});

function main(mysqlClient, mysqlStore) {

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
    store: mysqlStore,
    cookie: { path:'/', httpOnly:true, maxAge:COOKIEMAXAGE }
  }));
  app.use(require('connect-assets')({src:__dirname + '/lib', buildDir:__dirname + '/public'}));
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
  
  //User account schema
  var User = Models.User;
  var ChatMessage = Models.ChatMessage;
  
  //get the crafty server simulation
  var CraftyServer = require("./CraftyServer");
  CraftyServer.init();
  
  //set up variables for accessing the Game models
  var GE = require("./lib/js/entities");
  var GameEntities = new GE();
  var GameState = require("./models/gamestate");
  var Player = require("./models/player");
  var PlayerEntityTracker = [];
  //construct and initialize the gamestate
  var gs = new GameState({w:60, h:34, logs:15});
  gs.initialize();
  
  //loop over the entities in the new game and
  //  add them to the Crafty Server Simulation
  gs.entities.forEach(function(rawEnt, index) {
    var ent = GameEntities.get(rawEnt.name);
    ent.args(rawEnt.args);
    ent.initserver(CraftyServer);
  });
  
  //start the http server listening for requests
  server.listen(serverPort);
  
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
        mysqlStore.load(handShakeData.sessionID, function(err, sess) {
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
    }
    next();
  }
  
  //create the function that renders the home page
  function renderHome(req, res) {
    res.ViewData.title = "Monumentous";
    ChatMessage.all({order:"ts ASC", limit:20}, function(err, chatMessages) {
      res.set(noCacheResHeaders);
      res.ViewData.messages = JSON.stringify(chatMessages);
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

  app.get("/test", function(req, res) {
    res.ViewData.title = "Monumentous - Test";
    res.render("test", res.ViewData);
  });
  
  //handle gamestate json request
  app.get('/gamestate.json', function(req, res) {
    res.set('Content-Type', 'application/json');
    res.send(gs);
  });
  
  //handle event where account is created, or user logs in
  var accountCreateOrLogin = function(sess, user, fn) {
    //store the user in the session
    console.log(user);
    sess.user = user;
    //set up a player entity for this user, so they can play the game
    //determine starting point for the player entity
    //the map is edged by 1 tile of solid blocks, offset the player by 1 in the x direction and 1 in the y direction
    sess.player = new Player({id:UUIDGen.v4(), x:gs.tilesize, y:gs.tilesize});
    sess.save();
    return fn();
  };
  
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
    
    //broadcast to all connected sockets how many connections there are.
    //  we send the information to all sockets.
    //  a newly connected client will still need this information, even if it hasn't changed
    io.sockets.emit("connectedUsers", {count: userCount});
    
    //listen for new user accounts
    socket.on("createAccount", function(data) {
      console.log("try create");
      //make sure they aren't already signed in
      if (!hs.session.user && data.hasOwnProperty("username") && data.hasOwnProperty("password")) {
        var usrData = { username:data.username, password:data.password };
        if (data.hasOwnProperty("email") && typeof data.email === 'string' && data.email.length > 0) {
          usrData.email = data.email;
        }
        //generate the new user in a model
        User.create(usrData, function(err, usr) {
          var socketResponse = {};
          if (err) {
            console.log("could not create account.");
            socketResponse.result = false;
            if (usr.errors) {
              console.log(usr.errors);
              socketResponse.errors = usr.errors;
            }
            socket.emit("createAccount", socketResponse);
          } else {
            socketResponse = {result:true, username:usr.username};
            accountCreateOrLogin(hs.session, usr, function() {
              socket.emit("createAccount", socketResponse);
            });
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
            console.log(err);
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
                accountCreateOrLogin(hs.session, user, function(){
                  socket.emit("login", {result:true, username:user.username});
                });
              }
            });
          }
        });
      } else {
        socket.emit("login", {result:false});
      }
    });
    
    socket.on("joinGame", function(data) {
      if (hs.session.player !== null && typeof hs.session.player !== 'undefined') {
        //logged in user visited the game page,
        //  or user visited the game page and then logged it.
        //  get their player entity and add it to the gamestate
        //  notify other sockets about the update
        //check if this player entity is already in the game (can happen if a single user opens multiple tabs to the game)
        if (!gs.playerInGame(hs.session.player)) {
          //add the player to the server simulation
          var playerGE = GameEntities.get("player");
          playerGE.args({x:hs.session.player.x, y:hs.session.player.y, speed:hs.session.player.speed});
          var playerEnt = playerGE.initserver(CraftyServer);
          
          //associate the entity with this player's id
          PlayerEntityTracker.push({id:hs.session.player.id, entity:playerEnt});
          //add the player to the gamestate
          gs.players.push(hs.session.player);
          
          //tell other players a new player has joined
          socket.broadcast.emit("playerJoined", {player:hs.session.player});
        }
        
        //tell the user they joined successfully
        socket.emit("joinGame", {result:true, player:hs.session.player });
      } else{
        socket.emit("joinGame", {result:false});
      }
    });
    
    socket.on("gameUpdate", function(actionbuffer) {
      //make sure the socket is a "player"
      if (hs.session.player !== null && typeof hs.session.player !== 'undefined' && gs.playerInGame(hs.session.player)) {
        var playerIdx = -1;
        gs.players.some(function(pl, index) {
          var match = pl.id === hs.session.player.id;
          if (match) {
            playerIdx = index;
          }
          return match;
        });
        var playerEnt = null;
        PlayerEntityTracker.some(function(ent) {
          var match = ent.id === hs.session.player.id;
          if (match) {
            playerEnt = ent;
          }
          return match;
        });
        
        //TODO:  for right now i'm just letting the client do whatever,
        //  in the future i'll be running the actions through the server engine
        //  to get authoritive results.
        var actionCount = actionbuffer.length;
        if (playerIdx > -1 && playerEnt !== null) {
          actionbuffer.forEach(function(action, index) {
            //apply the actions
            switch (action.name) {
              case "move":
                hs.session.player.x = action.args.x;
                hs.session.player.y = action.args.y;
                playerEnt.x = action.args.x;
                playerEnt.y = action.args.y;
                gs.players[playerIdx] = hs.session.player;
                break;
              default:
                break;
            }
          });
          
          //send back corrected state to the original socket
          socket.emit("serverCorrection", {actionsCorrect:actionCount, playerUpdates:[hs.session.player]});
          
          //update the other sockets about the actions that occurred
          socket.broadcast.emit("gameUpdate", [hs.session.player]);
        }
      }
    });
    
    //listen for a chat message
    socket.on("chatMessage", function(data) {
      
      //set up the data that will be stored in the database
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
      // redisClient.lpush("chatMessages", JSON.stringify(pushData), function(err, reply) {
      // });
      console.log(pushData);
      ChatMessage.create(pushData, function(err, cm) {
        if (err) {
          console.log(err);
        }
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
        if (hs.session.player !== null && typeof hs.session.player !== 'undefined' && gs.playerInGame(hs.session.player)) {
          //find the index of the player object in the gamestate
          var pIndex = -1;
          gs.players.some(function(p, index) {
            var match = hs.session.player.id === p.id;
            if (match) {
              pIndex = index;
            }
            return match;
          });
          var pEnt = null;
          var pEntIdx = -1;
          PlayerEntityTracker.some(function(t, index) {
            var match = hs.session.player.id === t.id;
            if (match) {
              pEnt = t;
              pEntIdx = index;
            }
            return match;
          });
          
          if (pEnt !== null && pEntIdx >= 0) {
            //remove the entity from the Crafty Server Simulation
            PlayerEntityTracker.splice(pEntIdx, 1);
            pEnt.entity.destroy();
          }
          if (pIndex >= 0) {
            //remove the player from the gamestate
            gs.players.splice(pIndex, 1);
          }
          //notify other players
          socket.broadcast.emit("playerDisconnected", {player:hs.session.player});
        }
      }
      io.sockets.emit("connectedUsers", {count: userCount});
    });
  });
}
