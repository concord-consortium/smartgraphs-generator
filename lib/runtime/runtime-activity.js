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
  var Axis, RuntimeActivity, RuntimePage, RuntimeUnit, Step, slugify;
  slugify = require('../slugify').slugify;
  RuntimePage = require('./runtime-page').RuntimePage;
  Step = require('./step').Step;
  Axis = require('./axis').Axis;
  RuntimeUnit = require('./runtime-unit').RuntimeUnit;
  exports.RuntimeActivity = RuntimeActivity = (function() {
    function RuntimeActivity(owner, name) {
      this.owner = owner;
      this.name = name;
      this.pages = [];
      this.steps = [];
      this.unitRefs = {};
      this.axes = {};
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
    /*
        Forward references. (Things that may be used in one place but defined elsewhere.)
      */
    RuntimeActivity.prototype.getUnitRef = function(name) {
      var ref;
      if (ref = this.unitRefs[name]) {
        return ref;
      } else {
        ref = this.unitRefs[name] = {
          name: name,
          unit: null
        };
      }
      return ref;
    };
    RuntimeActivity.prototype.defineUnit = function(unit) {
      var ref;
      ref = this.getUnitRef(unit.name);
      if (ref.unit != null) {
        throw new Error("Warning: redefining unit " + ref.name);
      }
      ref.unit = unit;
      return unit;
    };
    /*
        Axis is an oddball for the time being. It's defined when used, but later we'll want to reuse axes
      */
    RuntimeActivity.prototype.createAndAppendAxis = function(_arg) {
      var axis, label, max, min, nSteps, unitRef;
      label = _arg.label, unitRef = _arg.unitRef, min = _arg.min, max = _arg.max, nSteps = _arg.nSteps;
      axis = new Axis({
        label: label,
        unitRef: unitRef,
        min: min,
        max: max,
        nSteps: nSteps
      });
      axis.activity = this;
      this.axes[axis.getUrl()] = axis;
      return axis;
    };
    RuntimeActivity.prototype.appendPage = function(page) {
      this.pages.push(page);
      page.setIndex(this.pages.length);
      return page;
    };
    RuntimeActivity.prototype.toHash = function() {
      var flatten, name, page, step, url;
      flatten = function(arrays) {
        var _ref;
        return (_ref = []).concat.apply(_ref, arrays);
      };
      return {
        _id: 'marias-run-generated-target.df6',
        _rev: 1,
        data_format_version: 6,
        activity: {
          title: this.name,
          url: this.getUrl(),
          owner: this.owner,
          pages: (function() {
            var _i, _len, _ref, _results;
            _ref = this.pages;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              page = _ref[_i];
              _results.push(page.getUrl());
            }
            return _results;
          }).call(this)
        },
        pages: (function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push((function() {
              var _j, _len2, _ref2, _results2;
              _ref2 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                step = _ref2[_j];
                _results2.push(step.toHash());
              }
              return _results2;
            })());
          }
          return _results;
        }).call(this)),
        responseTemplates: [],
        axes: (function() {
          var _results;
          _results = [];
          for (url in this.axes) {
            _results.push(this.axes[url].toHash());
          }
          return _results;
        }).call(this),
        datadefs: [],
        tags: [],
        annotations: [],
        variables: [],
        units: (function() {
          var _results;
          _results = [];
          for (name in this.unitRefs) {
            _results.push(this.unitRefs[name].unit.toHash());
          }
          return _results;
        }).call(this)
      };
    };
    return RuntimeActivity;
  })();
}).call(this);
