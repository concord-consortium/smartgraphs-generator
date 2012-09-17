
/*
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
*/

(function() {
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
      this.points = _arg.points, this.xLabel = _arg.xLabel, this.xUnitsRef = _arg.xUnitsRef, this.yLabel = _arg.yLabel, this.yUnitsRef = _arg.yUnitsRef, this.index = _arg.index, this.pointType = _arg.pointType, this.lineType = _arg.lineType, this.lineSnapDistance = _arg.lineSnapDistance;
      this.name = "datadef-" + this.index;
    }

    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };

    Datadef.prototype.toHash = function() {
      var _ref, _ref2;
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        xUnits: (_ref = this.xUnitsRef) != null ? _ref.unit.getUrl() : void 0,
        xLabel: this.xLabel,
        xShortLabel: this.xLabel,
        yUnits: (_ref2 = this.yUnitsRef) != null ? _ref2.unit.getUrl() : void 0,
        yLabel: this.yLabel,
        yShortLabel: this.yLabel,
        points: this.points,
        pointType: this.pointType,
        lineType: this.lineType,
        lineSnapDistance: this.lineSnapDistance
      };
    };

    return Datadef;

  })();

}).call(this);
