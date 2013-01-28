
/*
  Annotation class and its subclasses
*/

(function() {
  var Annotation, AnnotationCollection, FreehandSketch, HighlightedPoint, Label, LabelSet, LineThroughPoints, PointAxisLineVisualPrompt, PointCircleVisualPrompt, RangeVisualPrompt, RiseArrow, RiseBracket, RunArrow, RunBracket, SimpleAnnotation, annotations,
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
      this.datadefRef = _arg.datadefRef, this.tag = _arg.tag, this.color = _arg.color, this.index = _arg.index, this.name = _arg.name;
      if (this.name == null) this.name = "highlighted-point-" + this.index;
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

  annotations = [];

  SimpleAnnotation = (function(_super) {

    __extends(SimpleAnnotation, _super);

    SimpleAnnotation.prototype.RECORD_TYPE = 'SimpleAnnotation';

    SimpleAnnotation.prototype.namePrefix = 'rise-and-run';

    function SimpleAnnotation(_arg) {
      this.index = _arg.index, this.datadefRef = _arg.datadefRef, this.p1Tag = _arg.p1Tag, this.p2Tag = _arg.p2Tag, this.color = _arg.color, this.name = _arg.name;
      if (this.name == null) this.name = "" + this.namePrefix + this.index;
    }

    SimpleAnnotation.prototype.toHash = function() {
      var hash;
      hash = SimpleAnnotation.__super__.toHash.call(this);
      hash.color = this.color;
      hash.datadefName = this.datadefRef.datadef.name;
      hash.p1Tag = this.p1Tag.getUrl();
      hash.p2Tag = this.p2Tag.getUrl();
      return hash;
    };

    return SimpleAnnotation;

  })(Annotation);

  AnnotationCollection.classFor["Label"] = exports.Label = Label = (function(_super) {

    __extends(Label, _super);

    Label.prototype.RECORD_TYPE = 'Label';

    function Label(_arg) {
      this.index = _arg.index, this.point = _arg.point, this.text = _arg.text, this.name = _arg.name, this.namePrefix = _arg.namePrefix;
      if (this.namePrefix == null) this.namePrefix = 'label';
      if (this.name == null) this.name = "" + this.namePrefix + "-" + this.index;
      if (this.offset == null) this.offset = [void 0, void 0];
      if (this.point == null) this.point = [void 0, void 0];
    }

    Label.prototype.toHash = function() {
      var hash;
      hash = Label.__super__.toHash.call(this);
      hash.text = this.text;
      hash.x = this.point[0];
      hash.y = this.point[1];
      hash.xOffset = this.offset[0];
      hash.yOffset = this.offset[1];
      return hash;
    };

    return Label;

  })(Annotation);

  AnnotationCollection.classFor["LabelSet"] = exports.LabelSet = LabelSet = (function(_super) {

    __extends(LabelSet, _super);

    LabelSet.prototype.RECORD_TYPE = 'LabelSet';

    LabelSet.prototype.namePrefix = 'labelSet';

    function LabelSet(_arg) {
      this.index = _arg.index, this.labels = _arg.labels, this.name = _arg.name;
      if (this.name == null) this.name = "" + this.namePrefix + "-" + this.index;
    }

    LabelSet.prototype.toHash = function() {
      var hash;
      hash = LabelSet.__super__.toHash.call(this);
      hash.labels = this.labels;
      return hash;
    };

    return LabelSet;

  })(Annotation);

  AnnotationCollection.classFor["RunArrow"] = exports.RunArrow = RunArrow = (function(_super) {

    __extends(RunArrow, _super);

    function RunArrow() {
      RunArrow.__super__.constructor.apply(this, arguments);
    }

    RunArrow.prototype.RECORD_TYPE = 'RunArrow';

    RunArrow.prototype.namePrefix = 'run-arrow';

    return RunArrow;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RiseArrow"] = exports.RiseArrow = RiseArrow = (function(_super) {

    __extends(RiseArrow, _super);

    function RiseArrow() {
      RiseArrow.__super__.constructor.apply(this, arguments);
    }

    RiseArrow.prototype.RECORD_TYPE = 'RiseArrow';

    RiseArrow.prototype.namePrefix = 'rise-arrow';

    return RiseArrow;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RunBracket"] = exports.RunBracket = RunBracket = (function(_super) {

    __extends(RunBracket, _super);

    function RunBracket() {
      RunBracket.__super__.constructor.apply(this, arguments);
    }

    RunBracket.prototype.RECORD_TYPE = 'RunBracket';

    RunBracket.prototype.namePrefix = 'run-bracket';

    return RunBracket;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["RiseBracket"] = exports.RiseBracket = RiseBracket = (function(_super) {

    __extends(RiseBracket, _super);

    function RiseBracket() {
      RiseBracket.__super__.constructor.apply(this, arguments);
    }

    RiseBracket.prototype.RECORD_TYPE = 'RiseBracket';

    RiseBracket.prototype.namePrefix = 'rise-bracket';

    return RiseBracket;

  })(SimpleAnnotation);

  AnnotationCollection.classFor["LineThroughPoints"] = exports.LineThroughPoints = LineThroughPoints = (function(_super) {

    __extends(LineThroughPoints, _super);

    function LineThroughPoints() {
      LineThroughPoints.__super__.constructor.apply(this, arguments);
    }

    LineThroughPoints.prototype.RECORD_TYPE = 'LineThroughPoints';

    LineThroughPoints.prototype.namePrefix = 'line-throughpoints';

    return LineThroughPoints;

  })(SimpleAnnotation);

}).call(this);
