(function() {
  var ConstructedResponseTemplate, MultipleChoiceTemplate, NumericResponseTemplate, ResponseTemplate, ResponseTemplateCollection,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  ResponseTemplateCollection = exports.ResponseTemplateCollection = {
    classFor: {}
  };

  ResponseTemplate = (function() {

    function ResponseTemplate() {}

    ResponseTemplate.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/response-templates/" + this.name + "-" + this.number;
    };

    ResponseTemplate.prototype.toHash = function() {
      var _ref, _ref2;
      return {
        url: this.getUrl(),
        templateString: "",
        fieldChoicesList: [(_ref = this.choices) != null ? _ref : null],
        initialValues: (_ref2 = this.initialValues) != null ? _ref2 : [''],
        fieldTypes: this.fieldTypes
      };
    };

    return ResponseTemplate;

  })();

  ResponseTemplateCollection.classFor['NumericResponseTemplate'] = NumericResponseTemplate = (function(_super) {

    __extends(NumericResponseTemplate, _super);

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

  })(ResponseTemplate);

  ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] = ConstructedResponseTemplate = (function(_super) {

    __extends(ConstructedResponseTemplate, _super);

    function ConstructedResponseTemplate(number, initialValues) {
      var val;
      this.number = number;
      this.initialValues = initialValues != null ? initialValues : [""];
      ConstructedResponseTemplate.__super__.constructor.call(this);
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

    return ConstructedResponseTemplate;

  })(ResponseTemplate);

  ResponseTemplateCollection.classFor['MultipleChoiceTemplate'] = MultipleChoiceTemplate = (function(_super) {

    __extends(MultipleChoiceTemplate, _super);

    function MultipleChoiceTemplate(number, choices) {
      this.number = number;
      this.choices = choices;
      MultipleChoiceTemplate.__super__.constructor.call(this);
      this.name = "multiple-choice";
      this.fieldTypes = ["multiplechoice"];
    }

    return MultipleChoiceTemplate;

  })(ResponseTemplate);

}).call(this);
