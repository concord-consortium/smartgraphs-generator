{Page} = require './input.page'

exports.SensorPage = class SensorPage extends Page

  constructor: ->
    super()

  process: ->
    super()
    @step = @outputPage.appendStep()
    @step.addTool('sensor', @datadef)
    #...
