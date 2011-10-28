(function() {
  var Activity, dir, fs, hash, input, path;
  fs = require('fs');
  path = require('path');
  Activity = require('./input.activity').Activity;
  dir = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');
  input = fs.readFileSync(dir + '/input/marias-run.json', 'utf8');
  hash = JSON.parse(input);
  exports.activity = new Activity(hash);
}).call(this);
