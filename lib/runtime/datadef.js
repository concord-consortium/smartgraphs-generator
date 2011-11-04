(function() {
  /*
    Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
    FirstOrderDifference and Function Datadefs
  */
  var Datadef;
  exports.Datadef = Datadef = (function() {
    Datadef.serializeDatadefs = function(datadefs) {
      var datadef;
      if (datadefs.length === 0) {
        return [];
      } else {
        return [
          {
            type: 'UnorderedDataPoints',
            records: (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = datadefs.length; _i < _len; _i++) {
                datadef = datadefs[_i];
                _results.push(datadef.toHash());
              }
              return _results;
            })()
          }
        ];
      }
    };
    function Datadef(_arg) {
      this.points = _arg.points, this.xLabel = _arg.xLabel, this.xUnitsRef = _arg.xUnitsRef, this.yLabel = _arg.yLabel, this.yUnitsRef = _arg.yUnitsRef, this.index = _arg.index;
      this.name = "datadef-" + this.index;
    }
    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };
    Datadef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        xUnits: this.xUnitsRef.unit.getUrl(),
        xLabel: this.xLabel,
        xShortLabel: this.xLabel,
        yUnits: this.yUnitsRef.unit.getUrl(),
        yLabel: this.yLabel,
        yShortLabel: this.yLabel,
        points: this.points
      };
    };
    return Datadef;
  })();
}).call(this);
