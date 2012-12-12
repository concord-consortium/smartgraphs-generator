
/*
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
*/

(function() {
  var Datadef, dumbSingularize;

  dumbSingularize = require('../singularize').dumbSingularize;

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
      this.points = _arg.points, this.xLabel = _arg.xLabel, this.yLabel = _arg.yLabel, this.index = _arg.index, this.pointType = _arg.pointType, this.lineType = _arg.lineType, this.lineSnapDistance = _arg.lineSnapDistance, this.xUnits = _arg.xUnits, this.yUnits = _arg.yUnits, this.name = _arg.name, this.color = _arg.color;
      if (!_arg.name) this.name = "datadef-" + this.index;
      if (!_arg.lineSnapDistance) this.lineSnapDistance = 0;
    }

    Datadef.prototype.constructUnitRefs = function() {
      if (this.xUnits) {
        this.xUnitsRef = this.activity.getUnitRef(dumbSingularize(this.xUnits));
      }
      if (this.yUnits) {
        return this.yUnitsRef = this.activity.getUnitRef(dumbSingularize(this.yUnits));
      }
    };

    Datadef.prototype.setColor = function(color) {
      return this.color = color;
    };

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
        yUnits: (_ref2 = this.yUnitsRef) != null ? _ref2.unit.getUrl() : void 0,
        points: this.points,
        pointType: this.pointType,
        lineType: this.lineType,
        lineSnapDistance: this.lineSnapDistance,
        color: this.color
      };
    };

    return Datadef;

  })();

}).call(this);
