(function() {
  var InputActivity;
  InputActivity = require('./input/input-activity').InputActivity;
  exports.convert = function(input) {
    return new InputActivity(input).toOutputActivity().toHash();
  };
}).call(this);
