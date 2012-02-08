
/*
  Annotation class and its subclasses
*/

(function() {
  var Annotation, AnnotationCollection, FreehandSketch, HighlightedPoint, PointAxisLineVisualPrompt, PointCircleVisualPrompt, RangeVisualPrompt,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AnnotationCollection = exports.AnnotationCollection = {
    classFor: {}
  };

  exports.Annotation = Annotation = (function() {

    function Annotation() {}

    Annotation.serializeAnnotations = function(allAnnotations) {
      var annotation, annotationsOfOneType, key, ret;
      ret = [];
      for (key in allAnnotations) {
        annotationsOfOneType = allAnnotations[key];
        ret.push({
          type: annotationsOfOneType[0].RECORD_TYPE,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = annotationsOfOneType.length; _i < _len; _i++) {
              annotation = annotationsOfOneType[_i];
              _results.push(annotation.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    Annotation.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/annotations/" + this.name;
    };

    Annotation.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl()
      };
    };

    return Annotation;

  })();

  AnnotationCollection.classFor["HighlightedPoint"] = exports.HighlightedPoint = HighlightedPoint = (function(_super) {

    __extends(HighlightedPoint, _super);

    HighlightedPoint.prototype.RECORD_TYPE = 'HighlightedPoint';

    function HighlightedPoint(_arg) {
      this.datadefRef = _arg.datadefRef, this.tag = _arg.tag, this.color = _arg.color, this.index = _arg.index;
      this.name = "highlighted-point-" + this.index;
    }

    HighlightedPoint.prototype.toHash = function() {
      var hash;
      hash = HighlightedPoint.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.tag = this.tag.getUrl();
      hash.color = this.color;
      return hash;
    };

    return HighlightedPoint;

  })(Annotation);

  AnnotationCollection.classFor["RangeVisualPrompt"] = exports.RangeVisualPrompt = RangeVisualPrompt = (function(_super) {

    __extends(RangeVisualPrompt, _super);

    RangeVisualPrompt.prototype.RECORD_TYPE = 'SegmentOverlay';

    function RangeVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.index = _arg.index;
      this.name = "segment-overlay-" + this.index;
    }

    RangeVisualPrompt.prototype.toHash = function() {
      var hash, x1, x2;
      if (this.xMin === -Infinity) if (this.xMax !== Infinity) x1 = this.xMax;
      if (this.xMin !== -Infinity) {
        x1 = this.xMin;
        if (this.xMax !== Infinity) x2 = this.xMax;
      }
      hash = RangeVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.x1Record = x1;
      hash.x2Record = x2;
      if (this.xMin === -Infinity) hash.isUnboundedLeft = true;
      if (this.xMax === Infinity) hash.isUnboundedRight = true;
      return hash;
    };

    return RangeVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["PointCircleVisualPrompt"] = exports.PointCircleVisualPrompt = PointCircleVisualPrompt = (function(_super) {

    __extends(PointCircleVisualPrompt, _super);

    PointCircleVisualPrompt.prototype.RECORD_TYPE = 'CircledPoint';

    function PointCircleVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.x = _arg.x, this.y = _arg.y, this.index = _arg.index;
      this.name = "circled-point-" + this.index;
    }

    PointCircleVisualPrompt.prototype.toHash = function() {
      var hash;
      hash = PointCircleVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.xRecord = this.x;
      hash.yRecord = this.y;
      return hash;
    };

    return PointCircleVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["PointAxisLineVisualPrompt"] = exports.PointAxisLineVisualPrompt = PointAxisLineVisualPrompt = (function(_super) {

    __extends(PointAxisLineVisualPrompt, _super);

    PointAxisLineVisualPrompt.prototype.RECORD_TYPE = 'LineToAxis';

    function PointAxisLineVisualPrompt(_arg) {
      this.datadefRef = _arg.datadefRef, this.color = _arg.color, this.x = _arg.x, this.y = _arg.y, this.axis = _arg.axis, this.index = _arg.index;
      this.name = "line-to-axis-" + this.index;
    }

    PointAxisLineVisualPrompt.prototype.toHash = function() {
      var hash;
      hash = PointAxisLineVisualPrompt.__super__.toHash.call(this);
      hash.datadefName = this.datadefRef.datadef.name;
      hash.color = this.color;
      hash.xRecord = this.x;
      hash.yRecord = this.y;
      hash.axis = this.axis;
      return hash;
    };

    return PointAxisLineVisualPrompt;

  })(Annotation);

  AnnotationCollection.classFor["FreehandSketch"] = exports.FreehandSketch = FreehandSketch = (function(_super) {

    __extends(FreehandSketch, _super);

    FreehandSketch.prototype.RECORD_TYPE = 'FreehandSketch';

    function FreehandSketch(_arg) {
      this.index = _arg.index;
      this.name = "freehand-sketch-" + this.index;
    }

    FreehandSketch.prototype.toHash = function() {
      var hash;
      hash = FreehandSketch.__super__.toHash.call(this);
      hash.color = '#CC0000';
      hash.points = [];
      return hash;
    };

    return FreehandSketch;

  })(Annotation);

}).call(this);
