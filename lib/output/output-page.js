(function() {
  var OutputPage, Step, slugify;
  slugify = require('../slugify').slugify;
  Step = require('./step').Step;
  exports.OutputPage = OutputPage = (function() {
    function OutputPage(name) {
      this.name = name;
      this.steps = [];
      this.activity = null;
      this.index = null;
    }
    OutputPage.prototype.setText = function(text) {
      return this.introText = text;
    };
    OutputPage.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/page/" + this.index + "-" + (slugify(this.name));
    };
    OutputPage.prototype.appendStep = function() {
      var step;
      this.steps.push(step = new Step);
      step.page = this;
      step.index = this.steps.length;
      return step;
    };
    OutputPage.prototype.toHash = function() {
      var step, _ref;
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
        firstStep: (_ref = this.steps[0]) != null ? _ref.getUrl() : void 0
      };
    };
    return OutputPage;
  })();
}).call(this);
