(function() {
  var RuntimePage, Step, slugify;
  slugify = require('../slugify').slugify;
  Step = require('./step').Step;
  exports.RuntimePage = RuntimePage = (function() {
    function RuntimePage(name) {
      this.name = name;
      this.steps = [];
      this.activity = null;
      this.index = null;
    }
    RuntimePage.prototype.setText = function(text) {
      return this.introText = text;
    };
    RuntimePage.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/page/" + this.index + "-" + (slugify(this.name));
    };
    RuntimePage.prototype.appendStep = function() {
      var step;
      this.steps.push(step = new Step);
      step.page = this;
      step.index = this.steps.length;
      return step;
    };
    RuntimePage.prototype.toHash = function() {
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
    return RuntimePage;
  })();
}).call(this);