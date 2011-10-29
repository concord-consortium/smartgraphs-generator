fs = require 'fs'
path = require 'path'
exampleDataDir  = path.join(path.dirname(fs.realpathSync(__filename)), '../example-data');
{Activity} = require './input.activity'

exports.convert_funct= (input) ->
  activity = new Activity input
  output=
    _id: "marias-run-generated-target.df6"
    _rev: 1
    data_format_version: 6
  activity.process output
  output
