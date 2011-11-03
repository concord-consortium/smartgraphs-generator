exports.Axis = class Axis

  # a class property -- CS class bodies are executable code where '@' is the class name instead of 'this'
  @currentId = 1

  constructor: ({@label, @unitRef, @min, @max, @nSteps}) ->
    @id = Axis.currentId++

  getUrl: ->
    "#{@activity.getUrl()}/axes/#{@id}"

  toHash: ->
    { url: @getUrl(), units: @unitRef.unit.getUrl(), @min, @max, @nSteps, @label }
