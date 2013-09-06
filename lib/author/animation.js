(function() {
  var Animation, AnimationTool;

  AnimationTool = require('../runtime/animation-tool').AnimationTool;

  exports.Animation = Animation = (function() {

    function Animation(_arg, activity) {
      this.name = _arg.name, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.markedCoordinates = _arg.markedCoordinates, this.dataset = _arg.dataset;
      this.activity = activity;
      if (this.markedCoodinates == null) this.markedCoodinates = [];
      if (this.linkedAnimations == null) this.linkedAnimations = [];
    }

    Animation.prototype.getXMin = function() {
      var dataset;
      console.warn("Please don't call Animation.getXMin; the value should be in the semantic JSON.");
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[0][0];
    };

    Animation.prototype.getXMax = function() {
      var dataset;
      console.warn("Please don't call Animation.getXMax; the value should be in the semantic JSON.");
      dataset = this.activity.datasetsByName[this.dataset];
      return dataset.data[dataset.data.length - 1][0];
    };

    Animation.prototype.addLinkedAnimation = function(_arg) {
      this.pane = _arg.pane, this.datasets = _arg.datasets;
      return this.linkedAnimations.push({
        pane: this.pane,
        datasets: this.datasets
      });
    };

    Animation.prototype.toAnimationTool = function() {
      return new AnimationTool({
        datasetName: this.dataset,
        staticImageYValues: this.markedCoordinates,
        linkedAnimations: this.linkedAnimations
      });
    };

    return Animation;

  })();

}).call(this);
