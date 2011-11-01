(function() {
  var OutputPage, Step, slugify;
  slugify = require('../slugify').slugify;
  Step = require('./step').Step;
  exports.OutputPage = OutputPage = (function() {
    function OutputPage(inputPage) {
      this.inputPage = inputPage;
      this.name = this.inputPage.name;
      this.steps = [];
    }
    OutputPage.prototype.setText = function(text) {
      return this.introText = text;
    };
    OutputPage.prototype.url = function() {
      return "" + this.activity.url + "/page/" + this.index + "-" + (slugify(this.name));
    };
    OutputPage.prototype.appendStep = function() {
      var step;
      this.steps.push(step = new Step(this, this.steps.length + 1));
      return step;
    };
    OutputPage.prototype.toHash = function() {
      var step, _ref;
      return {
        name: this.name,
        url: this.url(),
        activity: this.activity.url,
        index: this.index,
        introText: this.introText,
        steps: (function() {
          var _i, _len, _ref, _results;
          _ref = this.steps;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            step = _ref[_i];
            _results.push(step.url());
          }
          return _results;
        }).call(this),
        firstStep: (_ref = this.steps[0]) != null ? _ref.url() : void 0
      };
    };
    return OutputPage;
  })();
}).call(this);
