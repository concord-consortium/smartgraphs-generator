exports.RuntimeUnit = class RuntimeUnit

  constructor: ->

  setProperties: ({@name, @abbreviation, @pluralName}) ->

  getUrl: ->
    "#{@activity.getUrl()}/units/#{@pluralName}"

  toHash: () ->
    { url: @getUrl(), activity: @activity.getUrl(), @name, @abbreviation, @pluralName }
