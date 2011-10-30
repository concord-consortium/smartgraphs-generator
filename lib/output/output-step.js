(function() {
  var OutputStep;
  exports.OutputStep = OutputStep = (function() {
    function OutputStep(doc, index, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activityPage = hash.activityPage.url();
      hash.url = "" + hash.activityPage + "/step/1";
    }
    OutputStep.prototype.url = function() {
      return this.hash.url;
    };
    OutputStep.prototype.addTool = function(name, options) {};
    return OutputStep;
  })();
}).call(this);
