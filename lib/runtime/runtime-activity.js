
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
  var Annotation, AnnotationCollection, Axis, DataRef, Datadef, HighlightedPoint, ResponseTemplateCollection, RuntimeActivity, RuntimePage, RuntimeUnit, SegmentOverlay, Step, Tag, expressionParser, slugify, _ref,
    __hasProp = Object.prototype.hasOwnProperty;

  slugify = require('../slugify').slugify;

  RuntimePage = require('./runtime-page').RuntimePage;

  Step = require('./step').Step;

  Axis = require('./axis').Axis;

  RuntimeUnit = require('./runtime-unit').RuntimeUnit;

  Datadef = require('./datadef').Datadef;

  DataRef = require('./dataref').DataRef;

  Tag = require('./tag').Tag;

  expressionParser = require('../author/expressionParser').expressionParser;

  _ref = require('./annotations'), AnnotationCollection = _ref.AnnotationCollection, Annotation = _ref.Annotation, HighlightedPoint = _ref.HighlightedPoint, SegmentOverlay = _ref.SegmentOverlay;

  ResponseTemplateCollection = require('./response-templates').ResponseTemplateCollection;

  exports.RuntimeActivity = RuntimeActivity = (function() {

    function RuntimeActivity(owner, name, authorName, ccProjectName, datasets, labelSets) {
      this.owner = owner;
      this.name = name;
      this.authorName = authorName;
      this.ccProjectName = ccProjectName;
      this.datasets = datasets;
      this.labelSets = labelSets;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
      this.nAxes = 0;
      this.datadefRefs = {};
      this.nDatadefs = 0;
      this.datarefRefs = {};
      this.nDatarefs = 0;
      this.annotations = {};
      this.annotationCounts = {};
      this.tags = [];
      this.nTags = 0;
      this.responseTemplates = {};
      this.responseTemplatesCounts = {};
      this.referenceDatadef;
      this.dataSetColors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"];
      this.colorIndex = this.dataSetColors.length - 1;
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

    RuntimeActivity.prototype.createDatadef = function(hash) {
      var datadef;
      hash.index = ++this.nDatadefs;
      datadef = new Datadef(hash);
      datadef.activity = this;
      datadef.populateSourceDatasets();
      datadef.constructUnitRefs();
      return datadef;
    };

    RuntimeActivity.prototype.createDataref = function(_arg) {
      var angularFunction, datadefName, dataref, expression, expressionForm, expressionType, index, lineSnapDistance, name, params, xInterval;
      datadefName = _arg.datadefName, expressionType = _arg.expressionType, expressionForm = _arg.expressionForm, expression = _arg.expression, angularFunction = _arg.angularFunction, xInterval = _arg.xInterval, params = _arg.params, index = _arg.index, lineSnapDistance = _arg.lineSnapDistance, name = _arg.name;
      dataref = new DataRef({
        datadefName: datadefName,
        expressionType: expressionType,
        expressionForm: expressionForm,
        expression: expression,
        angularFunction: angularFunction,
        xInterval: xInterval,
        params: params,
        index: ++this.nDatarefs,
        lineSnapDistance: lineSnapDistance,
        name: name
      });
      dataref.activity = this;
      return dataref;
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

    RuntimeActivity.prototype.hasDatadef = function(key) {
      return this.datadefRefs[key] != null;
    };

    RuntimeActivity.prototype.getDatarefRef = function(key) {
      var ref;
      if (ref = this.datarefRefs[key]) {
        return ref;
      } else {
        ref = this.datarefRefs[key] = {
          key: key,
          dataref: null
        };
      }
      return ref;
    };

    RuntimeActivity.prototype.hasDataref = function(key) {
      return this.datarefRefs[key] != null;
    };

    RuntimeActivity.prototype.defineDatadef = function(key, hash) {
      var ref;
      ref = this.getDatadefRef(key);
      if (ref.datadef == null) ref.datadef = this.createDatadef(hash);
      return ref.datadef;
    };

    RuntimeActivity.prototype.defineDataref = function(key, hash) {
      var ref;
      ref = this.getDatarefRef(key);
      if (ref.dataref == null) ref.dataref = this.createDataref(hash);
      return ref.dataref;
    };

    RuntimeActivity.prototype.populateDataSet = function(includedDataSets) {
      var activeDataSetIndex, datadef, dataref, datasetEntry, datasetObject, expressionData, populatedDataDefs, populatedDataRefs, _i, _j, _len, _len2, _ref2;
      populatedDataDefs = [];
      populatedDataRefs = [];
      activeDataSetIndex = 0;
      for (_i = 0, _len = includedDataSets.length; _i < _len; _i++) {
        datasetEntry = includedDataSets[_i];
        _ref2 = this.datasets;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          datasetObject = _ref2[_j];
          if (datasetObject.name === datasetEntry.name) {
            if (String(datasetObject.type).toLowerCase() === "datadef") {
              datadef = this.getDatadefRef(datasetObject.name).datadef;
              if (!(datadef != null)) {
                datadef = this.defineDatadef(datasetObject.name, {
                  points: datasetObject.data,
                  xUnits: datasetObject.xUnits,
                  yUnits: datasetObject.yUnits,
                  lineType: datasetObject.lineType,
                  pointType: datasetObject.pointType,
                  lineSnapDistance: datasetObject.lineSnapDistance,
                  name: datasetObject.name,
                  derivativeOf: datasetObject.derivativeOf,
                  piecewiseLinear: datasetObject.piecewiseLinear
                });
              }
              populatedDataDefs.push(datadef);
            } else if (String(datasetObject.type).toLowerCase() === "dataref") {
              this.expression = datasetObject.expression;
              if (this.expression !== null && this.expression !== void 0) {
                expressionData = expressionParser.parseExpression(this.expression);
                if ((expressionData.type != null) && expressionData.type !== "not supported") {
                  datadef = this.getDatadefRef(datasetObject.name).datadef;
                  if (datadef != null) {
                    dataref = this.getDatarefRef(datasetObject.name).dataref;
                  } else {
                    datadef = this.defineDatadef(datasetObject.name, {
                      points: [],
                      xUnits: datasetObject.xUnits,
                      yUnits: datasetObject.yUnits,
                      lineType: datasetObject.lineType,
                      lineSnapDistance: datasetObject.lineSnapDistance,
                      pointType: datasetObject.pointType,
                      name: datasetObject.name
                    });
                    dataref = this.defineDataref(datasetObject.name, {
                      datadefName: datadef.name,
                      expressionType: expressionData.type,
                      xInterval: datasetObject.xPrecision,
                      expressionForm: expressionData.form,
                      expression: datasetObject.expression,
                      angularFunction: expressionData.angularFunction,
                      params: expressionData.params,
                      lineSnapDistance: datasetObject.lineSnapDistance
                    });
                  }
                  populatedDataDefs.push(datadef);
                  populatedDataRefs.push(dataref);
                }
              }
            }
          }
        }
      }
      this.referenceDatadef = datadef;
      return {
        datadefs: populatedDataDefs,
        datarefs: populatedDataRefs
      };
    };

    RuntimeActivity.prototype.createNewEmptyDataRef = function(name, expression, xPrecision, lineSnapDistance, color) {
      var datadef, dataref, expressionData;
      if (expression !== null && expression !== void 0) {
        expressionData = expressionParser.parseExpression(expression);
        if ((expressionData.type != null) && expressionData.type !== "not supported") {
          if (!(datadef = this.getDatadefRef(name).datadef)) {
            datadef = this.defineDatadef(name, {
              points: [],
              xUnits: this.referenceDatadef.xUnits,
              yUnits: this.referenceDatadef.yUnits,
              lineType: 'connected',
              pointType: 'none',
              lineSnapDistance: this.referenceDatadef.lineSnapDistance,
              name: name,
              color: color
            });
            dataref = this.defineDataref(name, {
              datadefName: datadef.name,
              expressionType: expressionData.type,
              xInterval: xPrecision,
              expressionForm: expressionData.form,
              expression: expression,
              angularFunction: expressionData.angularFunction,
              params: expressionData.params,
              lineSnapDistance: lineSnapDistance
            });
          } else {
            dataref = this.getDatarefRef(datasetObject.name).dataref;
          }
          return {
            datadef: datadef,
            dataref: dataref
          };
        }
      }
    };

    RuntimeActivity.prototype.getNewColor = function() {
      if (!(this.colorIndex <= 0)) {
        return this.dataSetColors[this.colorIndex--];
      } else {
        throw new Error("No new color available.");
      }
    };

    RuntimeActivity.prototype.setColorOfDatadef = function(datadefName, color) {
      var datadef;
      if (datadef = this.getDatadefRef(datadefName).datadef) {
        return datadef.setColor(color);
      }
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
      var AnnotationClass, annotation, createdAnnotation, type, _base, _base2, _i, _len, _ref2;
      type = hash.type;
      if (this.annotations[type]) {
        _ref2 = this.annotations[type];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          createdAnnotation = _ref2[_i];
          if (createdAnnotation.name === hash.name) return createdAnnotation;
        }
      }
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

    RuntimeActivity.prototype.activityHash = function() {
      var page, result, url;
      result = {
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
      };
      if (this.ccProjectName) result['ccProjectName'] = this.ccProjectName;
      return result;
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
        activity: this.activityHash(),
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
        datarefs: this.nDatarefs !== 0 ? DataRef.serializeDataRefs(this.datarefRefs) : void 0,
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
