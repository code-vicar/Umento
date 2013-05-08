;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function() {
  var GL, RL, SGS, tickCount, timeStart;

  SGS = require("../index.js");

  GL = new SGS.GameLoop();

  RL = new SGS.RenderLoop(GL);

  tickCount = 0;

  timeStart = 0;

  RL.on("run", function() {
    return timeStart = Date.now();
  });

  RL.on("stop", function() {
    return console.log("~FPS: " + (tickCount / (Date.now() - timeStart)));
  });

  RL.on("tick", function(interp) {
    tickCount++;
    if (tickCount % 10 === 0) {
      console.log(interp);
    }
    if (tickCount === 100) {
      RL.Stop();
      return GL.Stop();
    }
  });

  GL.Run();

  RL.Run();

}).call(this);


},{"../index.js":2}],2:[function(require,module,exports){
var GameLoop = require("./server/GameLoop.coffee");
var RenderLoop = require("./client/RenderLoop.coffee");

module.exports.GameLoop = GameLoop;
module.exports.RenderLoop = RenderLoop;
},{"./server/GameLoop.coffee":3,"./client/RenderLoop.coffee":4}],3:[function(require,module,exports){
(function() {
  var EE, GameLoop, INTERVAL, TICKS_PER_SECOND,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EE = require('events').EventEmitter;

  TICKS_PER_SECOND = 25;

  INTERVAL = 1000 / TICKS_PER_SECOND;

  GameLoop = (function(_super) {
    __extends(GameLoop, _super);

    function GameLoop() {
      var _this = this;

      this.Tick = function() {
        var dNow;

        if (!_this.IsPaused) {
          dNow = Date.now();
          return _this.emit('tick', {
            "now": dNow,
            "next": dNow + INTERVAL,
            "interval": INTERVAL
          });
        }
      };
      this.IntervalID = 0;
      this.IsRunning = false;
      this.IsPaused = false;
    }

    GameLoop.prototype.Run = function() {
      if (!this.IsRunning) {
        this.Tick();
        this.IntervalID = setInterval(this.Tick, INTERVAL);
        this.IsRunning = true;
        return this.emit('run');
      } else if (this.IsPaused) {
        this.IsPaused = false;
        return this.emit('unpause');
      }
    };

    GameLoop.prototype.Stop = function() {
      if (this.IntervalID !== 0) {
        clearInterval(this.IntervalID);
        return this.emit('stop');
      }
    };

    GameLoop.prototype.Pause = function() {
      if (!this.IsPaused) {
        this.IsPaused = true;
        return this.emit('pause');
      }
    };

    return GameLoop;

  })(EE);

  module.exports = GameLoop;

}).call(this);


},{"events":5}],4:[function(require,module,exports){
(function() {
  var EE, RenderLoop, normalizeOnEachFrame,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  normalizeOnEachFrame = function() {
    var onEachFrame;

    onEachFrame = function(cb) {
      var _cb;

      _cb = function() {
        if (cb()) {
          return setTimeout(_cb, 1000 / 60);
        }
      };
      return _cb();
    };
    if (window.webkitRequestAnimationFrame) {
      onEachFrame = function(cb) {
        var _cb;

        _cb = function() {
          if (cb()) {
            return webkitRequestAnimationFrame(_cb);
          }
        };
        return _cb();
      };
    } else if (window.mozRequestAnimationFrame) {
      onEachFrame = function(cb) {
        var _cb;

        _cb = function() {
          if (cb()) {
            return mozRequestAnimationFrame(_cb);
          }
        };
        return _cb();
      };
    } else if (window.requestAnimationFrame) {
      onEachFrame = function(cb) {
        var _cb;

        _cb = function() {
          if (cb()) {
            return requestAnimationFrame(_cb);
          }
        };
        return _cb();
      };
    } else if (window.msRequestAnimationFrame) {
      onEachFrame = function(cb) {
        var _cb;

        _cb = function() {
          if (cb()) {
            return msRequestAnimationFrame(_cb);
          }
        };
        return _cb();
      };
    }
    return window.onEachFrame = onEachFrame;
  };

  EE = require('events').EventEmitter;

  RenderLoop = (function(_super) {
    __extends(RenderLoop, _super);

    function RenderLoop(GameLoopEmitter) {
      var _this = this;

      normalizeOnEachFrame();
      this.LastGameLoopTick = null;
      this.IsRunning = false;
      this.IsPaused = false;
      this.OnGameLogicTick = function(tick) {
        return _this.LastGameLoopTick = tick;
      };
      this.Tick = function() {
        var Interpolation, tDiff;

        if (!_this.IsRunning) {
          return false;
        }
        Interpolation = 0;
        if (_this.LastGameLoopTick) {
          tDiff = _this.LastGameLoopTick.next - Date.now();
          if (tDiff > 0) {
            Interpolation = tDiff / _this.LastGameLoopTick.interval;
          }
        }
        if (!_this.IsPaused) {
          _this.emit('tick', Interpolation);
        }
        return true;
      };
      this.GLE = GameLoopEmitter;
    }

    RenderLoop.prototype.Run = function() {
      if (!this.IsRunning) {
        this.GLE.on("tick", this.OnGameLogicTick);
        this.IsRunning = true;
        window.onEachFrame(this.Tick);
        this.emit('run');
      }
      if (this.IsPaused) {
        this.IsPaused = false;
        return this.emit('unpause');
      }
    };

    RenderLoop.prototype.Stop = function() {
      if (this.IsRunning) {
        this.GLE.removeListener("tick", this.OnGameLogicTick);
        this.LastGameLoopTick = null;
        this.IsRunning = false;
        return this.emit('stop');
      }
    };

    RenderLoop.prototype.Pause = function() {
      if (!this.IsPaused) {
        this.IsPaused = true;
        return this.emit('pause');
      }
    };

    return RenderLoop;

  })(EE);

  module.exports = RenderLoop;

}).call(this);


},{"events":5}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":6}]},{},[1])
;