{dumbSingularize} = require '../singularize'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text} = @hash

    @sequence = Sequence.fromHash @hash.sequence
    @sequence.page = this

    if @hash.panes?.length > 2
      throw new Error "There cannot be more than two panes"

    @panes = if @hash.panes? then (AuthorPane.fromHash h for h in @hash.panes) else []
    [pane.page, pane.index] = [this, index] for pane, index in @panes

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

# NB: The quotes around classFor keys are to maintain compatibility with Closure Compiler's advanced mode
# (in which object keys are minimized, just like vars, unless they're quoted)

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


Sequence.classFor['PickAPointSequence'] = class PickAPointSequence

  HIGHLIGHT_COLOR: '#1f77b4'

  constructor: ({@initialPrompt, @correctAnswerPoint, @hints, @giveUp, @confirmCorrect}) ->

  appendSteps: (runtimePage) ->

    for pane, i in @page.panes || []
      graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']

    if not graphPane? and not tablePane? then throw new Error "PickAPointSequence requires at least one graph or table pane"

    runtimeActivity = runtimePage.activity
    datadefRef = runtimeActivity.getDatadefRef "#{@page.index}-#{graphPane.index}"

    tag = runtimeActivity.createAndAppendTag()
    highlightedPoint = runtimeActivity.createAndAppendHighlightedPoint { datadefRef, tag, color: @HIGHLIGHT_COLOR }

    steps = []
    answerableSteps = []

    steps.push initialPromptStep = runtimePage.appendStep()
    answerableSteps.push initialPromptStep
    initialPromptStep.setBeforeText @initialPrompt

    for hint in @hints
      steps.push hintStep = runtimePage.appendStep()
      answerableSteps.push hintStep
      hintStep.setBeforeText hint.text

    steps.push giveUpStep = runtimePage.appendStep()
    giveUpStep.setBeforeText @giveUp.text

    steps.push confirmCorrectStep = runtimePage.appendStep()
    confirmCorrectStep.setBeforeText @confirmCorrect.text

    for step in steps
      pane.addToStep(step) for pane in @page.panes

    lastAnswerableStep = answerableSteps[answerableSteps.length-1]

    for step, index in answerableSteps
      if graphPane? then step.addAnnotationToPane { annotation: highlightedPoint, index: graphPane.index }
      if tablePane? then step.addAnnotationToPane { annotation: highlightedPoint, index: tablePane.index }

      step.addTaggingTool { tag, datadefRef }
      step.setSubmitButtonTitle "Check My Answer"

      # note that the end result is just that each step's default branch is the next one... but let's make the logic
      # more explicit
      if step is lastAnswerableStep
        step.setDefaultBranch giveUpStep
      else
        step.setDefaultBranch answerableSteps[index+1]

      step.appendResponseBranch {
        criterion: ["coordinates=", tag.name, @correctAnswerPoint[0], @correctAnswerPoint[1]]
        step: confirmCorrectStep
      }

###
  Pane types
###

AuthorPane =
  classFor: {}

  fromHash: (hash) ->
    PaneClass = @classFor[hash.type]
    if not PaneClass? then throw new Error "Pane type #{hash.type} is not supported"
    return new PaneClass hash


AuthorPane.classFor['PredefinedGraphPane'] = class PredefinedGraphPane

  constructor: ({@title, @data, @xLabel, @xUnits, @xMin, @xMax, @xTicks, @yLabel, @yUnits, @yMin, @yMax, @yTicks }) ->

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
