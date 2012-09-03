{dumbSingularize} = require '../singularize'
{expressionParser} = require './expressionParser'

AuthorPane = exports.AuthorPane =

  classFor: {}

  fromHash: (hash) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash


class GraphPane

  constructor: ({@title, @xLabel, @xUnits, @xMin, @xMax, @xTicks, @yLabel, @yUnits, @yMin, @yMax, @yTicks, includeAnnotationsFrom, @showCrossHairs, @showGraphGrid, @showToolTipCoords, @xPrecision, @yPrecision, @expression, @lineType, @pointType, @lineSnapDistance}) ->
    @annotationSources = includeAnnotationsFrom?.map (source) ->
      [page, pane] = (source.match /^page\/(\d)+\/pane\/(\d)+$/)[1..2].map (s) -> parseInt(s, 10) - 1
      { page, pane }

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    @xUnitsRef = runtimeActivity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = runtimeActivity.getUnitRef dumbSingularize @yUnits if @yUnits

    @xAxis = runtimeActivity.createAndAppendAxis { label: @xLabel, unitRef: @xUnitsRef, min: @xMin, max: @xMax, nSteps: @xTicks }
    @yAxis = runtimeActivity.createAndAppendAxis { label: @yLabel, unitRef: @yUnitsRef, min: @yMin, max: @yMax, nSteps: @yTicks }

    if @data?
      dataKey = "#{@page.index}-#{@index}"
      @datadefRef = runtimeActivity.getDatadefRef dataKey
      datadef = runtimeActivity.createDatadef { points: @data, @xLabel, @xUnitsRef, @yLabel, @yUnitsRef, @lineType, @pointType,@lineSnapDistance }
      runtimeActivity.defineDatadef dataKey, datadef

  addToStep: (step) ->
    step.addGraphPane { @title, @datadefRef, @xAxis, @yAxis, @index, @showCrossHairs, @showGraphGrid, @showToolTipCoords }

    @annotationSources?.forEach (source) =>
      pages = @page.activity.pages
      page = pages[source.page]
      pane = page?.panes[source.pane]

      if not page?
        throw new Error "When attempting to include annotations from pane #{pane+1} of page #{page+1}, couldn't find the page."

      if not pane?
        throw new Error "When attempting to include annotations from pane #{pane+1} of page #{page+1}, couldn't find the pane."

      if not pane.annotation?
        throw new Error "When attempting to include annotations from pane #{pane+1} of page #{page+1}, couldn't find the annotation."

      step.addAnnotationToPane { index: source.pane, annotation: pane.annotation }


AuthorPane.classFor['PredefinedGraphPane'] = class PredefinedGraphPane extends GraphPane

  constructor: ({@data}) ->
    super

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    super
    if @expression isnt null and @expression isnt undefined
      expressionData = expressionParser.parseExpression(@expression)
      if expressionData.type? and expressionData.type isnt "not supported"
        @dataRef = runtimeActivity.createDataRef { 
          expressionType:  expressionData.type,
          xInterval:       @xPrecision,
          expressionForm:  expressionData.form,
          angularFunction: expressionData.angularFunction,
          params:          expressionData.params,
          datadefname:     @datadefRef.datadef.name
        }
  addToStep: (step) ->
    super
    if @dataRef? then step.addDataRefToPane { @index, @dataRef }
        

AuthorPane.classFor['SensorGraphPane'] = class SensorGraphPane extends GraphPane

  constructor: ->
    super
    @data = []

  addToStep: (step) ->
    super
    step.addSensorTool { @index, @datadefRef }


AuthorPane.classFor['PredictionGraphPane'] = class PredictionGraphPane extends GraphPane

  constructor: ({@predictionType})->
    super

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    super
    @annotation = runtimeActivity.createAndAppendAnnotation {type: 'FreehandSketch'}

  addToStep: (step, {isActiveInputPane, previousAnnotation}) ->
    super
    if isActiveInputPane
      uiBehavior = if @predictionType is "continuous_curves" then "freehand" else "extend"
      step.addPredictionTool { @index, @datadefRef,  @annotation, uiBehavior }
      step.addAnnotationToPane { @index, @annotation }
    if previousAnnotation
      step.addAnnotationToPane { @index, annotation: previousAnnotation }


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



