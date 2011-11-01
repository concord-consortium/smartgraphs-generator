{InputActivity} = require './input/input-activity'

exports.convert = (input) ->
  new InputActivity(input).toOutputActivity().toHash()