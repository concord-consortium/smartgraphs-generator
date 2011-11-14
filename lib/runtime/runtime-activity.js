(function() {
  /*
    Output "Activity" object.
  
    This class maintains a set of child objects that represent something close to the output "Smartgraphs runtime JSON"
    format and has a toHash method to generate that format. (However, this class will likely maintain model objects that
    aren't explicitly represented in the final output hash or in the Smartgraphs runtime; for example, having an
    runtime/Graph class makes sense, even though the output hash is 'denormalized' and doesn't have an explicit
    representation of a Graph)
  
    Mostly, this class and the classes of its contained child objects implement builder methods that the author/* objects
    know how to call.
  */
  var Annotation, Axis, Datadef, HighlightedPoint, ResponseTemplateCollection, RuntimeActivity, RuntimePage, RuntimeUnit, SegmentOverlay, Step, Tag, slugify, _ref;
  var __hasProp = Object.prototype.hasOwnProperty;
  slugify = require('../slugify').slugify;
  RuntimePage = require('./runtime-page').RuntimePage;
  Step = require('./step').Step;
  Axis = require('./axis').Axis;
  RuntimeUnit = require('./runtime-unit').RuntimeUnit;
  Datadef = require('./datadef').Datadef;
  Tag = require('./tag').Tag;
  _ref = require('./annotations'), Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint, SegmentOverlay = _ref.SegmentOverlay;
  ResponseTemplateCollection = require('./responseTemplates').ResponseTemplateCollection;
  exports.RuntimeActivity = RuntimeActivity = (function() {
    function RuntimeActivity(owner, name) {
      this.owner = owner;
      this.name = name;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.annotations = {};
      this.nHighlightedPoints = 0;
      this.nSegmentOverlays = 0;
      this.tags = [];
      this.nTags = 0;
      this.responseTemplates = {};
    }
    RuntimeActivity.prototype.getUrl = function() {
      return "/" + this.owner + "/" + (slugify(this.name));
    };
    /*
        Factories for stuff we own. Could be metaprogrammed.
      */
    RuntimeActivity.prototype.createPage = function() {
      var page;
      page = new RuntimePage;
      page.activity = this;
      return page;
    };
    RuntimeActivity.prototype.createStep = function() {
      var step;
      step = new Step;
      step.activity = this;
      return step;
    };
    RuntimeActivity.prototype.createUnit = function() {
      var unit;
      unit = new RuntimeUnit;
      unit.activity = this;
      return unit;
    };
    RuntimeActivity.prototype.createDatadef = function(_arg) {
      var datadef, points, xLabel, xUnitsRef, yLabel, yUnitsRef;
      points = _arg.points, xLabel = _arg.xLabel, xUnitsRef = _arg.xUnitsRef, yLabel = _arg.yLabel, yUnitsRef = _arg.yUnitsRef;
      datadef = new Datadef({
        points: points,
        xLabel: xLabel,
        xUnitsRef: xUnitsRef,
        yLabel: yLabel,
        yUnitsRef: yUnitsRef,
        index: ++this.nDatadefs
      });
      datadef.activity = this;
      return datadef;
    };
    /*
        Forward references. Some of this is repetitious and should be factored out.
      */
    RuntimeActivity.prototype.getUnitRef = function(key) {
      var ref;
      if (ref = this.unitRefs[key]) {
        return ref;
      } else {
        ref = this.unitRefs[key] = {
          key: key,
          unit: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineUnit = function(key, unit) {
      var ref;
      ref = this.getUnitRef(key);
      if (ref.unit != null) {
        throw new Error("Redefinition of unit " + key);
      }
      ref.unit = unit;
      return unit;
    };
    RuntimeActivity.prototype.getDatadefRef = function(key) {
      var ref;
      if (ref = this.datadefRefs[key]) {
        return ref;
      } else {
        ref = this.datadefRefs[key] = {
          key: key,
          datadef: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineDatadef = function(key, datadef) {
      var ref;
      ref = this.getDatadefRef(key);
      if (ref.datadef != null) {
        throw new Error("Redefinition of datadef " + key);
      }
      ref.datadef = datadef;
      return datadef;
    };
    /*
        Things that are defined only inline (for now) and therefore don't need to be treated as forward references.
      */
    RuntimeActivity.prototype.createAndAppendAxis = function(_arg) {
      var axis, label, max, min, nSteps, unitRef;
      label = _arg.label, unitRef = _arg.unitRef, min = _arg.min, max = _arg.max, nSteps = _arg.nSteps;
      axis = new Axis({
        label: label,
        unitRef: unitRef,
        min: min,
        max: max,
        nSteps: nSteps,
        index: ++this.nAxes
      });
      axis.activity = this;
      this.axes[axis.getUrl()] = axis;
      return axis;
    };
    RuntimeActivity.prototype.createAndAppendTag = function() {
      var tag;
      tag = new Tag({
        index: ++this.nTags
      });
      tag.activity = this;
      this.tags.push(tag);
      return tag;
    };
    RuntimeActivity.prototype.createAndAppendHighlightedPoint = function(_arg) {
      var color, datadefRef, point, tag, _base, _ref2;
      datadefRef = _arg.datadefRef, tag = _arg.tag, color = _arg.color;
      point = new HighlightedPoint({
        datadefRef: datadefRef,
        tag: tag,
        color: color,
        index: ++this.nHighlightedPoints
      });
      point.activity = this;
      if ((_ref2 = (_base = this.annotations).highlightedPoints) == null) {
        _base.highlightedPoints = [];
      }
      this.annotations.highlightedPoints.push(point);
      return point;
    };
    RuntimeActivity.prototype.createAndAppendSegmentOverlay = function(_arg) {
      var color, datadefRef, overlay, xMax, xMin, _base, _ref2;
      datadefRef = _arg.datadefRef, color = _arg.color, xMin = _arg.xMin, xMax = _arg.xMax;
      overlay = new SegmentOverlay({
        datadefRef: datadefRef,
        color: color,
        xMin: xMin,
        xMax: xMax,
        index: ++this.nSegmentOverlays
      });
      overlay.activity = this;
      if ((_ref2 = (_base = this.annotations).segmentOverlays) == null) {
        _base.segmentOverlays = [];
      }
      this.annotations.segmentOverlays.push(overlay);
      return overlay;
    };
    RuntimeActivity.prototype.createAndAppendResponseTemplate = function(type) {
      var responseTemplate, templateClazz;
      templateClazz = ResponseTemplateCollection.classFor[type];
      if (!!this.responseTemplates[type]) {
        return this.responseTemplates[type];
      }
      responseTemplate = new templateClazz;
      responseTemplate.activity = this;
      this.responseTemplates[type] = responseTemplate;
      return responseTemplate;
    };
    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };
    RuntimeActivity.prototype.toHash = function() {
      var flatten, i, key, page, step, tag, template, url, _ref2;
      _ref2 = this.responseTemplates;
      for (template in _ref2) {
        if (!__hasProp.call(_ref2, template)) continue;
        debugger;
      }
      flatten = function(arrays) {
        var _ref3;
        return (_ref3 = []).concat.apply(_ref3, arrays);
      };
      return {
        _id: "" + (slugify(this.name)) + ".df6",
        _rev: 1,
        data_format_version: 6,
        activity: {
          title: this.name,
          url: this.getUrl(),
          owner: this.owner,
          pages: (function() {
            var _i, _len, _ref3, _results;
            _ref3 = this.pages;
            _results = [];
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              page = _ref3[_i];
              _results.push(page.getUrl());
            }
            return _results;
          }).call(this),
          axes: (function() {
            var _results;
            _results = [];
            for (url in this.axes) {
              _results.push(url);
            }
            return _results;
          }).call(this)
        },
        pages: (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            page = _ref3[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            page = _ref3[_i];
            _results.push((function() {
              var _j, _len2, _ref4, _results2;
              _ref4 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
                step = _ref4[_j];
                _results2.push(step.toHash());
              }
              return _results2;
            })());
          }
          return _results;
        }).call(this)),
        responseTemplates: (function() {
          var _ref3, _results;
          _ref3 = this.responseTemplates;
          _results = [];
          for (i in _ref3) {
            if (!__hasProp.call(_ref3, i)) continue;
            template = _ref3[i];
            _results.push(template.toHash());
          }
          return _results;
        }).call(this),
        axes: (function() {
          var _results;
          _results = [];
          for (url in this.axes) {
            _results.push(this.axes[url].toHash());
          }
          return _results;
        }).call(this),
        datadefs: Datadef.serializeDatadefs((function() {
          var _results;
          _results = [];
          for (key in this.datadefRefs) {
            _results.push(this.datadefRefs[key].datadef);
          }
          return _results;
        }).call(this)),
        tags: (function() {
          var _i, _len, _ref3, _results;
          _ref3 = this.tags;
          _results = [];
          for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
            tag = _ref3[_i];
            _results.push(tag.toHash());
          }
          return _results;
        }).call(this),
        annotations: Annotation.serializeAnnotations(this.annotations),
        variables: [],
        units: (function() {
          var _results;
          _results = [];
          for (key in this.unitRefs) {
            _results.push(this.unitRefs[key].unit.toHash());
          }
          return _results;
        }).call(this)
      };
    };
    return RuntimeActivity;
  })();
}).call(this);
