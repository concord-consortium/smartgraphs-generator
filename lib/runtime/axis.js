(function() {
  var Axis;
  exports.Axis = Axis = (function() {
    function Axis(_arg) {
      this.label = _arg.label, this.unitRef = _arg.unitRef, this.min = _arg.min, this.max = _arg.max, this.nSteps = _arg.nSteps, this.index = _arg.index;
    }
    Axis.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/axes/" + this.index;
    };
    Axis.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        units: this.unitRef.unit.getUrl(),
        min: this.min,
        max: this.max,
        nSteps: this.nSteps,
        label: this.label
      };
    };
    return Axis;
  })();
}).call(this);
