(function() {
  var Page, Step;
  Step = require('./output.page').Step;
  exports.Page = Page = (function() {
    function Page() {
      this.steps = [];
    }
    Page.prototype.toHash = function() {
      return hash;
    };
    Page.prototype.appendStep = function() {
      var step;
      step = new Step(this);
      this.steps.push(step);
      return step;
    };
    return Page;
  })();
}).call(this);
