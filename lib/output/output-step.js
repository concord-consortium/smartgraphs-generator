(function() {
  var OutputStep;
  exports.OutputStep = OutputStep = (function() {
    function OutputStep(page, index) {
      this.page = page;
      this.index = index;
      this.panes = null;
    }
    OutputStep.prototype.addImagePane = function(url, license, attribution) {
      return this.panes = {
        single: {
          type: 'image',
          path: url,
          caption: "" + license + " " + attribution
        }
      };
    };
    OutputStep.prototype.url = function() {
      return "" + (this.page.url()) + "/step/" + this.index;
    };
    OutputStep.prototype.toHash = function() {
      return {
        url: this.url(),
        activityPage: this.page.url(),
        paneConfig: 'single',
        panes: this.panes,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return OutputStep;
  })();
}).call(this);
