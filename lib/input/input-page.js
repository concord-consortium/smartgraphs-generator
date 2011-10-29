(function() {
  var InputPage, slugify;
  slugify = require('../slugify').slugify;
  exports.InputPage = InputPage = (function() {
    function InputPage(hash, activity, index) {
      var _ref;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
      this.url = "" + this.activity.url + "/page/" + (slugify(this.name));
      this.stepUrl = this.url + "/step/1";
    }
    InputPage.prototype.convert = function() {
      return this.outputPage = this.outputActivity.appendPage(this);
    };
    InputPage.prototype.process = function(output) {
      output.pages.push({
        name: this.name,
        url: this.url,
        activity: this.activity.url,
        index: this.index,
        introText: this.text,
        steps: [this.stepUrl],
        firstStep: this.stepUrl
      });
      return output.steps.push({
        url: this.stepUrl,
        activityPage: this.url,
        paneConfig: 'single',
        panes: null,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      });
    };
    return InputPage;
  })();
}).call(this);
