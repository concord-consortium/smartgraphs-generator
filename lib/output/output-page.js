(function() {
  var OutputPage, slugify;
  slugify = require('../slugify').slugify;
  exports.OutputPage = OutputPage = (function() {
    function OutputPage(doc, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activity = hash.activity.url();
      hash.steps = [];
      hash.url = "" + hash.activity + "/page/" + hash.index + "-" + (slugify(hash.name));
    }
    OutputPage.prototype.url = function() {
      return this.hash.url;
    };
    OutputPage.prototype.appendStep = function(props) {
      var index, step;
      props.activityPage = this;
      index = this.hash.steps.length + 1;
      step = this.doc.createStep(index, props);
      this.hash.steps.push(step.url());
      if (index === 1) {
        this.hash.firstStep = step.url();
      }
      return step;
    };
    return OutputPage;
  })();
}).call(this);
