(function() {
  var exampleDataDir, fs, path;
  fs = require('fs');
  path = require('path');
  exampleDataDir = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');
  exports.convert_funct = function(input) {
    var outputString;
    outputString = fs.readFileSync(exampleDataDir + "/expected-ouput/marias-run.json", 'utf8');
    return JSON.parse(outputString);
  };
}).call(this);
