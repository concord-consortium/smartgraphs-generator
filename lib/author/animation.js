(function() {
  var Animation, AnimationTool;

  AnimationTool = require('../runtime/animation-tool').AnimationTool;

  exports.Animation = Animation = (function() {

    function Animation(_arg, activity) {
      this.name = _arg.name, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.markedCoordinates = _arg.markedCoordinates, this.dataset = _arg.dataset;
      this.activity = activity;
      if (this.markedCoodinates == null) this.markedCoodinates = [];
    }

    Animation.prototype.getXMin = function() {
      var dataset;
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[0][0];
    };

    Animation.prototype.getXMax = function() {
      var dataset;
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[dataset.data.length - 1][0];
    };

    Animation.prototype.toAnimationTool = function() {
      return new AnimationTool({
        datasetName: this.dataset,
        staticImageYValues: this.markedCoordinates
      });
    };

    return Animation;

  })();

}).call(this);
