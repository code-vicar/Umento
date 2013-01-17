(function() {
  var UmView, ns,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  ns = window.Umento = window.Umento || {};

  UmView = (function(_super) {

    __extends(UmView, _super);

    function UmView() {
      return UmView.__super__.constructor.apply(this, arguments);
    }

    UmView.prototype.assign = function(view, selector) {
      return view.setElement(this.$(selector)).render();
    };

    return UmView;

  })(Backbone.View);

  return UmView;

}).call(this);
