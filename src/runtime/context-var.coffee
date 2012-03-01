# This is a very shallow wrapper ...

exports.ContextVar = class ContextVar

  constructor: ({@name, @value}) ->

  toHash: ->
    name:      @name
    value:     @value
    