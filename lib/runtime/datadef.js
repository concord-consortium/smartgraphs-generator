
/*
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
*/

(function() {
  var Datadef, dumbSingularize;

  dumbSingularize = require('../singularize').dumbSingularize;

  exports.Datadef = Datadef = (function() {

    Datadef.serializeDatadefs = function(datadefs) {
      var datadef, derivative, derivatives, ret, udp, udps, _i, _len;
      udps = [];
      derivatives = [];
      ret = [];
      for (_i = 0, _len = datadefs.length; _i < _len; _i++) {
        datadef = datadefs[_i];
        if (datadef.derivativeOf != null) {
          derivatives.push(datadef);
        } else {
          udps.push(datadef);
        }
      }
      if (udps.length > 0) {
        ret.push({
          type: 'UnorderedDataPoints',
          records: (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = udps.length; _j < _len2; _j++) {
              udp = udps[_j];
              _results.push(udp.toHash());
            }
            return _results;
          })()
        });
      }
      if (derivatives.length > 0) {
        ret.push({
          type: 'FirstDerivative',
          records: (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = derivatives.length; _j < _len2; _j++) {
              derivative = derivatives[_j];
              _results.push(derivative.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function Datadef(_arg) {
      this.points = _arg.points, this.index = _arg.index, this.pointType = _arg.pointType, this.lineType = _arg.lineType, this.lineSnapDistance = _arg.lineSnapDistance, this.xUnits = _arg.xUnits, this.yUnits = _arg.yUnits, this.name = _arg.name, this.color = _arg.color, this.derivativeOf = _arg.derivativeOf, this.piecewiseLinear = _arg.piecewiseLinear;
      if (this.name == null) this.name = "datadef-" + this.index;
      if (this.lineSnapDistance == null) this.lineSnapDistance = 0;
    }

    Datadef.prototype.populateSourceDatasets = function() {
      if (this.derivativeOf != null) {
        return this.activity.populateDataSet([
          {
            name: this.derivativeOf
          }
        ]);
      }
    };

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

    Datadef.prototype.getDerivativeSourceType = function(sourceDataName) {
      if (this.activity.hasDataref(sourceDataName)) {
        return 'dataref';
      } else if (this.activity.hasDatadef(sourceDataName)) {
        return 'datadef';
      } else {
        throw new Error("unknown source data: " + sourceDataName);
      }
    };

    Datadef.prototype.getDerivativeSourceName = function(sourceDataName) {
      var sourceType;
      sourceType = this.getDerivativeSourceType(sourceDataName);
      if (sourceType === 'datadef') return sourceDataName;
      return this.activity.getDatarefRef(sourceDataName).dataref.name;
    };

    Datadef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datadefs/" + this.name;
    };

    Datadef.prototype.toHash = function() {
      var hash, _ref, _ref2;
      hash = {
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
      if (this.derivativeOf != null) {
        hash.sourceType = this.getDerivativeSourceType(this.derivativeOf);
        hash.source = this.getDerivativeSourceName(this.derivativeOf);
        hash.sourceIsPiecewiseLinear = this.piecewiseLinear || false;
      }
      return hash;
    };

    return Datadef;

  })();

}).call(this);
