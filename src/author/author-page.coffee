{dumbSingularize} = require '../singularize'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text} = @hash

    @sequence = Sequence.fromHash @hash.sequence
    @sequence.page = this

    if @hash.panes?.length > 2
      throw new Error "There cannot be more than two panes"

    @panes = if @hash.panes? then (AuthorPane.fromHash(h, i) for h, i in @hash.panes) else []
    pane.page = this for pane in @panes

  toRuntimePage: (runtimeActivity) ->
    runtimePage = runtimeActivity.createPage()

    runtimePage.setName @name
    runtimePage.setText @text

    pane.addToPageAndActivity(runtimePage, runtimeActivity) for pane in @panes

    @sequence.appendSteps runtimePage

    runtimePage

###
  Sequence types
###

Sequence =
  classFor: {}

  fromHash: (hash) ->
    SequenceClass = @classFor[hash?.type || 'NoSequence']
    if not SequenceClass? then throw new Error "Sequence type #{hash.type} is not supported"
    return new SequenceClass hash


Sequence.classFor['NoSequence'] = class NoSequence

  appendSteps: (runtimePage) ->
    step = runtimePage.appendStep()
    pane.addToStep(step) for pane in @page.panes


Sequence.classFor['InstructionSequence'] = class InstructionSequence

  constructor: ({@text}) ->

  appendSteps: (runtimePage) ->
    step = runtimePage.appendStep()
    step.setBeforeText @text
    pane.addToStep(step) for pane in @page.panes

###
  Pane types
###

AuthorPane =
  classFor: {}

  fromHash: (hash, index) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash, index


AuthorPane.classFor['PredefinedGraphPane'] = class PredefinedGraphPane

  constructor: ({@title, @data, @xLabel, @xUnits, @xMin, @xMax, @xTicks, @yLabel, @yUnits, @yMin, @yMax, @yTicks }, @index) ->

  addToPageAndActivity: (runtimePage, runtimeActivity) ->
    @xUnitsRef = runtimeActivity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = runtimeActivity.getUnitRef dumbSingularize @yUnits if @yUnits

    @xAxis = runtimeActivity.createAndAppendAxis { label: @xLabel, unitRef: @xUnitsRef, min: @xMin, max: @xMax, nSteps: @xTicks }
    @yAxis = runtimeActivity.createAndAppendAxis { label: @yLabel, unitRef: @yUnitsRef, min: @yMin, max: @yMax, nSteps: @yTicks }

    if @data?
      dataKey = "#{@page.name}-#{@index}"
      @datadefRef = runtimeActivity.getDatadefRef dataKey
      datadef = runtimeActivity.createDatadef { points: @data, @xLabel, @xUnitsRef, @yLabel, @yUnitsRef }
      runtimeActivity.defineDatadef dataKey, datadef

  addToStep: (step) ->
    step.addGraphPane { @title, @datadefRef, @xAxis, @yAxis, @index }


AuthorPane.classFor['ImagePane'] = class ImagePane

  constructor: ({@url, @license, @attribution}, @index) ->

  addToPageAndActivity: (runtimePage, runtimeActivity) ->

  addToStep: (step) ->
    step.addImagePane { @url, @license, @attribution, @index }


AuthorPane.classFor['TablePane'] = class TablePane

  constructor: ({}, @index) ->

  addToPageAndActivity: (runtimePage, @runtimeActivity) ->

  addToStep: (step) ->
    otherPaneIndex = 1 - @index
    dataKey = "#{@page.name}-#{otherPaneIndex}"
    datadefRef = @runtimeActivity.getDatadefRef dataKey     # get the datadef defined in the *other* pane on this page
    step.addTablePane { datadefRef, @index }
