(function() {
  var Page;
  exports.Page = Page = (function() {
    function Page(hash, activity) {
      this.hash = hash;
      this.activity = activity;
      this.outputActivity = this.activity.outputActivity;
      return;
    }
    Page.prototype.process = function() {
      return this.outputPage = this.outputActivity.appendPage(this);
    };
    return Page;
  })();
}).call(this);
