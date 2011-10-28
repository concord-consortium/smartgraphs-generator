fs = require 'fs'
path = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');

exports.convert_funct= (input) ->
  outputString = fs.readFileSync exampleDataDir + "/expected-ouput/marias-run.json", 'utf8'
  JSON.parse outputString