(function() {
  var Tag;
  exports.Tag = Tag = (function() {
    function Tag(_arg) {
      this.index = _arg.index;
      this.name = "tag-" + this.index;
    }
    Tag.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/tags/" + this.name;
    };
    Tag.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        name: this.name
      };
    };
    return Tag;
  })();
}).call(this);
