(function() {
  var Step;
  exports.Step = Step = (function() {
    function Step() {
      this.panes = null;
      this.page = null;
      this.index = null;
    }
    Step.prototype.addImagePane = function(url, license, attribution) {
      return this.panes = {
        single: {
          type: 'image',
          path: url,
          caption: "" + license + " " + attribution
        }
      };
    };
    Step.prototype.url = function() {
      return "" + (this.page.url()) + "/step/" + this.index;
    };
    Step.prototype.toHash = function() {
      return {
        url: this.url(),
        activityPage: this.page.url(),
        paneConfig: 'single',
        panes: this.panes,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return Step;
  })();
}).call(this);
