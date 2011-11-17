(function() {
  var NumericResponseTemplate, ResponseTemplate, ResponseTemplateCollection;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  ResponseTemplateCollection = exports.ResponseTemplateCollection = {
    classFor: {}
  };
  ResponseTemplate = (function() {
    function ResponseTemplate() {}
    ResponseTemplate.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/response-templates/" + this.name + "-" + this.number;
    };
    ResponseTemplate.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        templateString: "",
        fieldChoicesList: [null],
        initialValues: this.initialValues,
        fieldTypes: this.fieldTypes
      };
    };
    return ResponseTemplate;
  })();
  ResponseTemplateCollection.classFor['NumericResponseTemplate'] = NumericResponseTemplate = (function() {
    __extends(NumericResponseTemplate, ResponseTemplate);
    function NumericResponseTemplate(number, initialValues) {
      var val;
      this.number = number;
      this.initialValues = initialValues != null ? initialValues : [""];
      NumericResponseTemplate.__super__.constructor.call(this);
      this.name = "numeric";
      this.fieldTypes = (function() {
        var _i, _len, _ref, _results;
        _ref = this.initialValues;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          val = _ref[_i];
          _results.push("numeric");
        }
        return _results;
      }).call(this);
    }
    return NumericResponseTemplate;
  })();
  ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] = NumericResponseTemplate = (function() {
    __extends(NumericResponseTemplate, ResponseTemplate);
    function NumericResponseTemplate(number, initialValues) {
      var val;
      this.number = number;
      this.initialValues = initialValues != null ? initialValues : [""];
      NumericResponseTemplate.__super__.constructor.call(this);
      this.name = "open";
      this.fieldTypes = (function() {
        var _i, _len, _ref, _results;
        _ref = this.initialValues;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          val = _ref[_i];
          _results.push("textarea");
        }
        return _results;
      }).call(this);
    }
    return NumericResponseTemplate;
  })();
}).call(this);
