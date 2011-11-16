{dumbSingularize} = require '../singularize'

AuthorPane = exports.AuthorPane =

  classFor: {}

  fromHash: (hash) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash



class GraphPane

  constructor: ({@title, @xLabel, @xUnits, @xMin, @xMax, @xTicks, @yLabel, @yUnits, @yMin, @yMax, @yTicks }) ->

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    @xUnitsRef = runtimeActivity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = runtimeActivity.getUnitRef dumbSingularize @yUnits if @yUnits

    @xAxis = runtimeActivity.createAndAppendAxis { label: @xLabel, unitRef: @xUnitsRef, min: @xMin, max: @xMax, nSteps: @xTicks }
    @yAxis = runtimeActivity.createAndAppendAxis { label: @yLabel, unitRef: @yUnitsRef, min: @yMin, max: @yMax, nSteps: @yTicks }

    if @data?
      dataKey = "#{@page.index}-#{@index}"
      @datadefRef = runtimeActivity.getDatadefRef dataKey
      datadef = runtimeActivity.createDatadef { points: @data, @xLabel, @xUnitsRef, @yLabel, @yUnitsRef }
      runtimeActivity.defineDatadef dataKey, datadef

  addToStep: (step) ->
    step.addGraphPane { @title, @datadefRef, @xAxis, @yAxis, @index }


AuthorPane.classFor['PredefinedGraphPane'] = class PredefinedGraphPane extends GraphPane

  constructor: ({@data}) ->
    super


AuthorPane.classFor['SensorGraphPane'] = class SensorGraphPane extends GraphPane

  constructor: ->
    super
    @data = []

  addToStep: (step) ->
    super
    step.addSensorTool { @index, @datadefRef }


AuthorPane.classFor['ImagePane'] = class ImagePane

  constructor: ({@url, @license, @attribution}) ->

  addToPageAndActivity: (runtimePage, runtimeActivity) ->

  addToStep: (step) ->
    step.addImagePane { @url, @license, @attribution, @index }


AuthorPane.classFor['TablePane'] = class TablePane

  addToPageAndActivity: (runtimePage, @runtimeActivity) ->

  addToStep: (step) ->
    otherPaneIndex = 1 - @index
    dataKey = "#{@page.index}-#{otherPaneIndex}"
    datadefRef = @runtimeActivity.getDatadefRef dataKey     # get the datadef defined in the *other* pane on this page
    step.addTablePane { datadefRef, @index }



