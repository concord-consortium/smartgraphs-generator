exports.Axis = class Axis

  constructor: ({@label, @unitRef, @min, @max, @nSteps, @index}) ->

  getUrl: ->
    "#{@activity.getUrl()}/axes/#{@index}"

  toHash: ->
    { url: @getUrl(), units: @unitRef?.unit.getUrl(), @min, @max, @nSteps, @label }
