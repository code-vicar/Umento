(function(exports) {
  var GameState;
  GameState = (function() {

    function GameState(props) {
      var key, val;
      this.h = 0;
      this.w = 0;
      this.logs = 0;
      this.entities = [];
      for (key in props) {
        val = props[key];
        if (props.hasOwnProperty(key) && typeof val !== 'Object' && typeof val !== 'function' && typeof val !== 'undefined' && val !== null) {
          if (this.hasOwnProperty(key)) {
            this[key] = val;
          } else {
            Object.defineProperty(this, key, Object.getOwnPropertyDescriptor(props, key));
          }
        }
      }
    }

    GameState.prototype.initialize = function() {
      var log, x, y, _i, _j, _k, _ref, _ref1, _ref2, _results;
      if (this.w > 0 && this.h > 0) {
        for (x = _i = 0, _ref = this.w - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; x = 0 <= _ref ? ++_i : --_i) {
          for (y = _j = 0, _ref1 = this.h - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; y = 0 <= _ref1 ? ++_j : --_j) {
            this.entities.push({
              x: x,
              y: y,
              entity: 'grass'
            });
          }
        }
        _results = [];
        for (log = _k = 0, _ref2 = this.logs; 0 <= _ref2 ? _k < _ref2 : _k > _ref2; log = 0 <= _ref2 ? ++_k : --_k) {
          x = Math.floor(Math.random() * (this.w - 1));
          y = Math.floor(Math.random() * (this.h - 1));
          _results.push(this.entities.push({
            x: x,
            y: y,
            entity: 'log'
          }));
        }
        return _results;
      }
    };

    return GameState;

  })();
  if (typeof window !== 'undefined' && window !== null) {
    exports = GameState;
  } else {
    exports = module.exports = GameState;
  }
  return exports;
})(typeof exports === 'undefined' ? {} : exports);