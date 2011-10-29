{InputPage} = require './input-page'

exports.SensorPage = class SensorPage extends InputPage

  constructor: ->
    super()

  convert: ->
    super()
    @step = @outputPage.appendStep()
    @step.addTool 'sensor', @datadef
    #...
