exports.Step = class Step

  constructor: (@page) ->
    @id = null # to be resolved when the containing Page is output to a hash

  addTool: (name, options) ->
    # remember that we need a tool stanza in our output hash...
