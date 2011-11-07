(function() {
  var RuntimePage, slugify;
  slugify = require('../slugify').slugify;
  exports.RuntimePage = RuntimePage = (function() {
    function RuntimePage() {
      this.steps = [];
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
    RuntimePage.prototype.appendStep = function(sequence) {
      var step;
      this.steps.push(step = this.activity.createStep(sequence));
      step.page = this;
      step.setIndex(this.steps.length);
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
