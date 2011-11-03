(function() {
  var RuntimeUnit;
  exports.RuntimeUnit = RuntimeUnit = (function() {
    function RuntimeUnit() {}
    RuntimeUnit.prototype.setProperties = function(_arg) {
      this.name = _arg.name, this.abbreviation = _arg.abbreviation, this.pluralName = _arg.pluralName;
    };
    RuntimeUnit.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/units/" + this.pluralName;
    };
    RuntimeUnit.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        name: this.name,
        abbreviation: this.abbreviation,
        pluralName: this.pluralName
      };
    };
    return RuntimeUnit;
  })();
}).call(this);
