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
      return "" + (this.activity.getUrl()) + "/response-templates/" + this.name;
    };
    ResponseTemplate.prototype.toHash = function() {
      return {
        url: this.getUrl()
      };
    };
    return ResponseTemplate;
  })();
  ResponseTemplateCollection.classFor['NumericResponseTemplate'] = NumericResponseTemplate = (function() {
    __extends(NumericResponseTemplate, ResponseTemplate);
    function NumericResponseTemplate(initialValues) {
      this.initialValues = initialValues != null ? initialValues : [""];
      this.name = "numeric";
    }
    NumericResponseTemplate.prototype.toHash = function() {
      var hash;
      hash = NumericResponseTemplate.__super__.toHash.call(this);
      hash.templateString = "";
      hash.fieldTypes = ["numeric"];
      hash.fieldChoicesList = [null];
      hash.initialValues = this.initialValues;
      return hash;
    };
    return NumericResponseTemplate;
  })();
  ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] = NumericResponseTemplate = (function() {
    __extends(NumericResponseTemplate, ResponseTemplate);
    function NumericResponseTemplate(initialValues) {
      this.initialValues = initialValues != null ? initialValues : [""];
      this.name = "open";
    }
    NumericResponseTemplate.prototype.toHash = function() {
      var hash;
      hash = NumericResponseTemplate.__super__.toHash.call(this);
      hash.templateString = "";
      hash.fieldTypes = ["textarea"];
      hash.fieldChoicesList = [null];
      hash.initialValues = this.initialValues;
      return hash;
    };
    return NumericResponseTemplate;
  })();
}).call(this);
