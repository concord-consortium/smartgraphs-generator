(function() {
  var InputPage, SensorPage;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  InputPage = require('./input-page').InputPage;
  exports.SensorPage = SensorPage = (function() {
    __extends(SensorPage, InputPage);
    function SensorPage() {
      SensorPage.__super__.constructor.call(this);
    }
    SensorPage.prototype.convert = function() {
      SensorPage.__super__.convert.call(this);
      this.step = this.outputPage.appendStep();
      return this.step.addTool('sensor', this.datadef);
    };
    return SensorPage;
  })();
}).call(this);
