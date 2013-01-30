{dumbSingularize} = require '../singularize'

AuthorPane = exports.AuthorPane =

  classFor: {}

  fromHash: (hash) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash


class GraphPane

  constructor: ({@title, @xLabel, @xMin, @xMax, @xTicks, @yLabel, @yMin, @yMax, @yTicks, includeAnnotationsFrom, @showCrossHairs, @showGraphGrid, @showToolTipCoords, @includedDataSets, @labelSets}) ->
    @activeDataSetIndex = 0
    @totalDatasetsIndex = 0
    @activeDatasetName
    @datadefRef = []
    unless @includedDataSets then @includedDataSets = []
    unless @labelSets then @labelSets = []
    @annotationSources = includeAnnotationsFrom?.map (source) ->
      [page, pane] = (source.match /^page\/(\d)+\/pane\/(\d)+$/)[1..2].map (s) -> parseInt(s, 10) - 1
      { page, pane }

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    @runtimeActivity = runtimeActivity
    if @includedDataSets?
      unless @includedDataSets.length is 0
        populatedDataSets = runtimeActivity.populateDataSet @xLabel, @yLabel, @includedDataSets
        populatedDataDefs = populatedDataSets.datadef
        @dataRef = populatedDataSets.dataref

        unless @activeDatasetName
          @activeDatasetName = populatedDataDefs[@activeDataSetIndex].name

        for dataRef in @dataRef
          if @activeDatasetName is dataRef.name
            @activeDatasetName = dataRef.datadefname
            break

        for populatedDataDef in populatedDataDefs
          dataKey = "#{populatedDataDef.name}"
          runtimeActivity.defineDatadef dataKey, populatedDataDef
          if @activeDatasetName is populatedDataDef.name
            @xUnitsRef = populatedDataDef.xUnitsRef
            @yUnitsRef = populatedDataDef.yUnitsRef
          @datadefRef.push runtimeActivity.getDatadefRef dataKey

    @xAxis = runtimeActivity.createAndAppendAxis { label: @xLabel, unitRef: @xUnitsRef, min: @xMin, max: @xMax, nSteps: @xTicks }
    @yAxis = runtimeActivity.createAndAppendAxis { label: @yLabel, unitRef: @yUnitsRef, min: @yMin, max: @yMax, nSteps: @yTicks }

  addToStep: (step) ->
    step.addGraphPane { @title, @datadefRef, @xAxis, @yAxis, @index, @showCrossHairs, @showGraphGrid, @showToolTipCoords, @includedDataSets, @activeDatasetName, @dataRef, @labelSets}
    if @labelSets
      for labelSetName in @labelSets
        if @runtimeActivity.annotations['LabelSet']
          for createdAnnotation in @runtimeActivity.annotations['LabelSet']
            if createdAnnotation.name is labelSetName
              step.addAnnotationToPane
                annotation: createdAnnotation
                index: @index

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

  constructor: ->
    super

AuthorPane.classFor['SensorGraphPane'] = class SensorGraphPane extends GraphPane

  constructor: ->
    super

  addToStep: (step) ->
    super
    dataKey = "#{@activeDatasetName}"
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

  constructor: ({ @xLabel, @yLabel }) ->

  addToPageAndActivity: (runtimePage, @runtimeActivity) ->

  addToStep: (step) ->
    otherPaneIndex = 1 - @index
    dataKey = "#{@page.panes[otherPaneIndex].activeDatasetName}"
    datadefRef = @runtimeActivity.getDatadefRef dataKey     # get the datadef defined in the *other* pane on this page
    step.addTablePane { datadefRef, @index, @xLabel, @yLabel }
