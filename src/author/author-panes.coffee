{dumbSingularize} = require '../singularize'

AuthorPane = exports.AuthorPane =

  classFor: {}

  fromHash: (hash) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash


class GraphPane

  constructor: ({@title, @xLabel, @xUnits, @xMin, @xMax, @xTicks, @yLabel, @yUnits, @yMin, @yMax, @yTicks, includeAnnotationsFrom, @showCrossHairs, @showGraphGrid, @showToolTipCoords, @includedDataSets}) ->
    @activeDataSetIndex = 0
    @totalDatasetsIndex = 0
    @activeDatasetName
    @datadefRef = []
    unless @includedDataSets then @includedDataSets = []
    @annotationSources = includeAnnotationsFrom?.map (source) ->
      [page, pane] = (source.match /^page\/(\d)+\/pane\/(\d)+$/)[1..2].map (s) -> parseInt(s, 10) - 1
      { page, pane }

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    @xUnitsRef = runtimeActivity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = runtimeActivity.getUnitRef dumbSingularize @yUnits if @yUnits

    @xAxis = runtimeActivity.createAndAppendAxis { label: @xLabel, unitRef: @xUnitsRef, min: @xMin, max: @xMax, nSteps: @xTicks }
    @yAxis = runtimeActivity.createAndAppendAxis { label: @yLabel, unitRef: @yUnitsRef, min: @yMin, max: @yMax, nSteps: @yTicks }

    
    if @includedDataSets?
      unless @includedDataSets.length is 0
        populatedDataSets = runtimeActivity.populateDataSet @xLabel, @xUnitsRef, @yLabel, @yUnitsRef, @includedDataSets
        populatedDataDefs = populatedDataSets.datadef
        @dataRef = populatedDataSets.dataref

        for dataRef in @dataRef
          if @activeDatasetName is dataRef.name
            @activeDatasetName = dataRef.datadefname
            break

        for populatedDataDef in populatedDataDefs
          dataKey = "#{@page.index}-#{@index}-#{@totalDatasetsIndex++}"
          runtimeActivity.defineDatadef dataKey, populatedDataDef
          if @activeDatasetName is populatedDataDef.name then @activeDataSetIndex = @totalDatasetsIndex - 1
          @datadefRef.push runtimeActivity.getDatadefRef dataKey

        unless @activeDatasetName
          @activeDatasetName = populatedDataDefs[@activeDataSetIndex].name

  addToStep: (step) ->
    step.addGraphPane { @title, @datadefRef, @xAxis, @yAxis, @index, @showCrossHairs, @showGraphGrid, @showToolTipCoords, @includedDataSets, @activeDatasetName }

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

  addToStep: (step) ->
    super
    # add all datarefs sent back from populateDataSet
    if @dataRef? then step.addDataRefToPane { @index, @dataRef }

AuthorPane.classFor['SensorGraphPane'] = class SensorGraphPane extends GraphPane

  constructor: ->
    super

  addToStep: (step) ->
    super
    dataKey = "#{@page.index}-#{@index}-#{@activeDataSetIndex}"
    datadefRef
    for dataDefRef in @datadefRef
      if dataDefRef.key is dataKey
        datadefRef = dataDefRef
    step.addSensorTool { @index, datadefRef }


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
    dataKey = "#{@page.index}-#{otherPaneIndex}-#{@page.panes[otherPaneIndex].activeDataSetIndex}"
    datadefRef = @runtimeActivity.getDatadefRef dataKey     # get the datadef defined in the *other* pane on this page
    step.addTablePane { datadefRef, @index }
