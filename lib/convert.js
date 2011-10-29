(function() {
  var Activity, exampleDataDir, fs, path;
  fs = require('fs');
  path = require('path');
  exampleDataDir = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');
  Activity = require('./input.activity').Activity;
  exports.convert_funct = function(input) {
    var activity, output;
    activity = new Activity(input);
    output = {
      _id: "marias-run-generated-target.df6",
      _rev: 1,
      data_format_version: 6
    };
    activity.process(output);
    return output;
  };
}).call(this);
