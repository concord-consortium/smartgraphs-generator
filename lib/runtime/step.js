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
    Step.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
    };
    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
    };
    Step.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        paneConfig: 'single',
        panes: this.panes,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return Step;
  })();
}).call(this);
