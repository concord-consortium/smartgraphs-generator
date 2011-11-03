(function() {
  var Unit;
  exports(Unit = Unit = (function() {
    function Unit() {}
    Unit.prototype.setProperties = function(_arg) {
      this.name = _arg.name, this.abbreviation = _arg.abbreviation, this.pluralName = _arg.pluralName;
    };
    Unit.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/units/" + this.pluralName;
    };
    Unit.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        activity: this.activity.getUrl(),
        name: this.name,
        abbreviation: this.abbreviation,
        pluralName: this.pluralName
      };
    };
    return Unit;
  })());
}).call(this);
