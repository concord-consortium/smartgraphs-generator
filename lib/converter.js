(function() {
  var InputActivity;
  InputActivity = require('./input/input-activity').InputActivity;
  exports.convert = function(input) {
    var activity, output;
    activity = new InputActivity(input);
    output = {
      _id: "marias-run-generated-target.df6",
      _rev: 1,
      data_format_version: 6
    };
    activity.process(output);
    return output;
  };
}).call(this);
