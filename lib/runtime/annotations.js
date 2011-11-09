(function() {
  /*
    Annotation class and its subclasses
  */
  var Annotation, HighlightedPoint;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
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
  exports.HighlightedPoint = HighlightedPoint = (function() {
    __extends(HighlightedPoint, Annotation);
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
  })();
}).call(this);
