{InputActivity} = require './input/input-activity'

exports.convert = (input) ->
  activity = new InputActivity input
  output =
    _id: "marias-run-generated-target.df6"
    _rev: 1
    data_format_version: 6
  activity.process output
  output
