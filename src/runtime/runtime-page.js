(function() {
  var ContextVar, RuntimePage, slugify;

  slugify = require('../slugify').slugify;

  ContextVar = require('./context-var').ContextVar;

  exports.RuntimePage = RuntimePage = (function() {

    function RuntimePage() {
      this.steps = [];
      this.contextVars = [];
      this.index = null;
    }

    RuntimePage.prototype.setText = function(introText) {
      this.introText = introText;
      return this.introText;
    };

    RuntimePage.prototype.setName = function(name) {
      this.name = name;
      return this.name;
    };

    RuntimePage.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
    };

    RuntimePage.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/page/" + this.index + "-" + (slugify(this.name));
    };

    RuntimePage.prototype.appendStep = function() {
      var step;
      this.steps.push(step = this.activity.createStep());
      step.page = this;
      step.setIndex(this.steps.length);
      return step;
    };

    RuntimePage.prototype.toHash = function() {
      var step, varariable, _ref;
      return {
        name: this.name,
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        index: this.index,
        introText: this.introText,
        steps: (function() {
          var _i, _len, _ref, _results;
          _ref = this.steps;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            step = _ref[_i];
            _results.push(step.getUrl());
          }
          return _results;
        }).call(this),
        firstStep: (_ref = this.steps[0]) != null ? _ref.getUrl() : void 0,
        contextVars: (function() {
          var _i, _len, _ref2, _results;
          _ref2 = this.contextVars;
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            varariable = _ref2[_i];
            _results.push(variable.toHash());
          }
          return _results;
        }).call(this)
      };
    };

    RuntimePage.prototype.addContextVar = function(contextVar) {
      return this.contextVars.push(contextVar);
    };

    RuntimePage.prototype.addNewContextVar = function(definition) {
      return this.addContextVar(new ContextVar(definition));
    };

    RuntimePage.prototype.addSlopeVars = function(pointA, pointB) {
      var definition, _i, _len, _ref, _results;
      _ref = this.slopeVarDefs(pointA, pointB);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        definition = _ref[_i];
        _results.push(this.addNewContextVar(definition));
      }
      return _results;
    };

    RuntimePage.prototype.slopeVarDefs = function(pointA, pointB) {
      return [
        {
          "name": "start-y",
          "value": ["coord", "y", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]],
          "name": "start-y_str",
          "value": ["toFixedString", ["get", "start-y"], 2],
          "name": "end-y",
          "value": ["coord", "y", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]],
          "name": "end-y_str",
          "value": ["toFixedString", ["get", "end-y"], 2],
          "name": "change-y",
          "value": ["-", ["get", "end-y"], ["get", "start-y"]],
          "name": "change-y_str",
          "value": ["toFixedString", ["get", "change-y"], 2],
          "name": "start-x",
          "value": ["coord", "x", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]],
          "name": "start-x_str",
          "value": ["toFixedString", ["get", "start-x"], 2],
          "name": "end-x",
          "value": ["coord", "x", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]],
          "name": "end-x_str",
          "value": ["toFixedString", ["get", "end-x"], 2],
          "name": "change-x",
          "value": ["-", ["get", "end-x"], ["get", "start-x"]],
          "name": "change-x_str",
          "value": ["toFixedString", ["get", "change-x"], 2],
          "name": "slope",
          "value": ["/", ["get", "change-y"], ["get", "change-x"]],
          "name": "slope_str",
          "value": ["toFixedString", ["get", "slope"], 2],
          "name": "change-y-units",
          "value": ["pluralizeUnits", "/builtins/units/meters", ["get", "change-y"]],
          "name": "change-x-units",
          "value": ["pluralizeUnits", "/builtins/units/seconds", ["get", "change-x"]],
          "name": "slope-units",
          "value": ["pluralizeUnits", "/builtins/units/meters-per-second", ["get", "slope"]]
        }
      ];
    };

    return RuntimePage;

  })();

}).call(this);
