(function() {
  var Step;
  exports.Step = Step = (function() {
    function Step() {
      this.panesHash = null;
      this.page = null;
      this.index = null;
    }
    Step.prototype.addImagePane = function(url, license, attribution) {
      return this.panesHash = {
        single: {
          type: 'image',
          path: url,
          caption: "" + license + " " + attribution
        }
      };
    };
    Step.prototype.addGraphPane = function(_arg) {
      var title, xAxis, yAxis;
      title = _arg.title, xAxis = _arg.xAxis, yAxis = _arg.yAxis;
      return this.panesHash = {
        single: {
          type: 'graph',
          title: title,
          xAxis: xAxis.getUrl(),
          yAxis: yAxis.getUrl(),
          annotations: []
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
        panes: this.panesHash,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return Step;
  })();
}).call(this);
