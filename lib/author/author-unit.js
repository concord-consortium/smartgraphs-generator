(function() {
  var AuthorUnit, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorUnit = AuthorUnit = (function() {
    function AuthorUnit(hash, activity) {
      this.hash = hash;
      this.activity = activity;
      this.name = hash.name, this.abbreviation = hash.abbreviation;
    }
    AuthorUnit.prototype.toRuntimeUnit = function(runtimeActivity) {
      var runtimeUnit;
      runtimeUnit = runtimeActivity.createUnit();
      runtimeUnit.setProperties({
        name: dumbSingularize(this.name),
        pluralName: this.name,
        abbreviation: this.abbreviation
      });
      return runtimeUnit;
    };
    return AuthorUnit;
  })();
}).call(this);
