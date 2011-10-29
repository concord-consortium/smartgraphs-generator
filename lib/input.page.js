(function() {
  var Page;
  exports.Page = Page = (function() {
    function Page(hash, activity, index) {
      var _ref;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
      this.url = this.activity.url + "/page/" + this.index;
      this.stepUrl = this.url + "/step/1";
    }
    Page.prototype.convert = function() {
      return this.outputPage = this.outputActivity.appendPage(this);
    };
    Page.prototype.process = function(output) {
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
    return Page;
  })();
}).call(this);
