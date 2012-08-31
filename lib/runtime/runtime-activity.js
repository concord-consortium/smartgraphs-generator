
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

(function() {
  var Annotation, AnnotationCollection, Axis, DataRef, Datadef, HighlightedPoint, ResponseTemplateCollection, RuntimeActivity, RuntimePage, RuntimeUnit, SegmentOverlay, Step, Tag, slugify, _ref,
    __hasProp = Object.prototype.hasOwnProperty;

  slugify = require('../slugify').slugify;

  RuntimePage = require('./runtime-page').RuntimePage;

  Step = require('./step').Step;

  Axis = require('./axis').Axis;

  RuntimeUnit = require('./runtime-unit').RuntimeUnit;

  Datadef = require('./datadef').Datadef;

  DataRef = require('./dataref').DataRef;

  Tag = require('./tag').Tag;

  _ref = require('./annotations'), AnnotationCollection = _ref.AnnotationCollection, Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint, SegmentOverlay = _ref.SegmentOverlay;

  ResponseTemplateCollection = require('./response-templates').ResponseTemplateCollection;

  exports.RuntimeActivity = RuntimeActivity = (function() {

    function RuntimeActivity(owner, name, authorName) {
      this.owner = owner;
      this.name = name;
      this.authorName = authorName;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.dataRefRefs = {};
      this.nDataRefs = 0;
      this.annotations = {};
      this.annotationCounts = {};
      this.tags = [];
      this.nTags = 0;
      this.responseTemplates = {};
      this.responseTemplatesCounts = {};
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
      var datadef, lineSnapDistance, lineType, pointType, points, xLabel, xUnitsRef, yLabel, yUnitsRef;
      points = _arg.points, xLabel = _arg.xLabel, xUnitsRef = _arg.xUnitsRef, yLabel = _arg.yLabel, yUnitsRef = _arg.yUnitsRef, pointType = _arg.pointType, lineType = _arg.lineType, lineSnapDistance = _arg.lineSnapDistance;
      datadef = new Datadef({
        points: points,
        xLabel: xLabel,
        xUnitsRef: xUnitsRef,
        yLabel: yLabel,
        yUnitsRef: yUnitsRef,
        index: ++this.nDatadefs,
        pointType: pointType,
        lineType: lineType,
        lineSnapDistance: lineSnapDistance
      });
      datadef.activity = this;
      return datadef;
    };

    RuntimeActivity.prototype.createDataRef = function(_arg) {
      var dataRef, datadefname, expressionForm, expressionType, index, params, xInterval, _base;
      datadefname = _arg.datadefname, expressionType = _arg.expressionType, expressionForm = _arg.expressionForm, xInterval = _arg.xInterval, params = _arg.params, index = _arg.index;
      dataRef = new DataRef({
        datadefname: datadefname,
        expressionType: expressionType,
        expressionForm: expressionForm,
        xInterval: xInterval,
        params: params,
        index: ++this.nDataRefs
      });
      dataRef.activity = this;
      if ((_base = this.dataRefRefs)[expressionType] == null) {
        _base[expressionType] = [];
      }
      this.dataRefRefs[expressionType].push(dataRef);
      return dataRef;
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
      if (ref.unit != null) throw new Error("Redefinition of unit " + key);
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
      if (ref.datadef != null) throw new Error("Redefinition of datadef " + key);
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

    RuntimeActivity.prototype.createAndAppendAnnotation = function(hash) {
      var AnnotationClass, annotation, type, _base, _base2;
      type = hash.type;
      AnnotationClass = AnnotationCollection.classFor[type];
      if ((_base = this.annotationCounts)[type] == null) _base[type] = 0;
      hash.index = ++this.annotationCounts[type];
      annotation = new AnnotationClass(hash);
      annotation.activity = this;
      if ((_base2 = this.annotations)[type] == null) _base2[type] = [];
      this.annotations[type].push(annotation);
      return annotation;
    };

    RuntimeActivity.prototype.createAndAppendResponseTemplate = function(type, initialValues, choices) {
      var TemplateClass, count, key, responseTemplate, _base;
      if (initialValues == null) initialValues = [""];
      TemplateClass = ResponseTemplateCollection.classFor[type];
      key = TemplateClass.getUniqueKey(initialValues, choices);
      if (this.responseTemplates[key]) return this.responseTemplates[key];
      if ((_base = this.responseTemplatesCounts)[type] == null) _base[type] = 0;
      count = ++this.responseTemplatesCounts[type];
      this.responseTemplates[key] = responseTemplate = new TemplateClass(count, initialValues, choices);
      responseTemplate.activity = this;
      return responseTemplate;
    };

    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };

    RuntimeActivity.prototype.toHash = function() {
      var flatten, i, key, page, step, tag, template, url;
      flatten = function(arrays) {
        var _ref2;
        return (_ref2 = []).concat.apply(_ref2, arrays);
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
            var _i, _len, _ref2, _results;
            _ref2 = this.pages;
            _results = [];
            for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
              page = _ref2[_i];
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
          }).call(this),
          authorName: this.authorName
        },
        pages: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            page = _ref2[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.pages;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            page = _ref2[_i];
            _results.push((function() {
              var _j, _len2, _ref3, _results2;
              _ref3 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
                step = _ref3[_j];
                _results2.push(step.toHash());
              }
              return _results2;
            })());
          }
          return _results;
        }).call(this)),
        responseTemplates: (function() {
          var _ref2, _results;
          _ref2 = this.responseTemplates;
          _results = [];
          for (i in _ref2) {
            if (!__hasProp.call(_ref2, i)) continue;
            template = _ref2[i];
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
        datarefs: this.nDataRefs !== 0 ? DataRef.serializeDataRefs(this.dataRefRefs) : void 0,
        tags: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.tags;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            tag = _ref2[_i];
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
