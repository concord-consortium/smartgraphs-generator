{AuthorPane} = require './author-panes'

Sequence = exports.Sequence =

  classFor: {}

  fromHash: (hash) ->
    SequenceClass = @classFor[hash.type ? 'NoSequence']
    if not SequenceClass? then throw new Error "Sequence type #{hash.type} is not supported"
    return new SequenceClass hash

# NB: The quotes around classFor keys are to maintain compatibility with Closure Compiler's advanced mode
# (in which object keys are minimized, just like vars, unless they're quoted)


Sequence.classFor['NoSequence'] = class NoSequence

  constructor: ({@page}) ->
    @predictionPanes = []               # TODO: should support sensor panes as well (generic "input" panes)
    for pane, i in @page.panes || []
      @predictionPanes.push(pane) if pane instanceof AuthorPane.classFor['PredictionGraphPane']

  # NoSequence will normally append a single step, unless there are multiple panes requiring user input
  appendSteps: (runtimePage) ->
    steps = []
    numSteps =  @predictionPanes.length or 1

    for n in [0...numSteps]
      step = runtimePage.appendStep()
      steps[n-1].setDefaultBranch step unless n is 0

      for pane, i in @page.panes
        isActiveInputPane = (i is n) or (@predictionPanes.length is 1)
        previousAnnotation = if (!isActiveInputPane and i is 0) then @page.panes[0].annotation
        pane.addToStep(step, {isActiveInputPane, previousAnnotation})

      if @predictionPanes[n]?
        step.setSubmissibilityCriterion [">=", ["sketchLength", @predictionPanes[n].annotation.name], 0.2]
        step.setSubmissibilityDependsOn ["annotation", @predictionPanes[n].annotation.name]
      steps.push step

    steps

Sequence.classFor['InstructionSequence'] = class InstructionSequence extends NoSequence

  constructor: ({@text, @page}) ->
    super

  appendSteps: (runtimePage) ->
    steps = super
    for step in steps
      step.setBeforeText @text


Sequence.classFor['ConstructedResponseSequence'] = class ConstructedResponseSequence

  constructor: ({@initialPrompt, @initialContent, @page}) ->

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate "ConstructedResponseTemplate", [@initialContent]

    step = runtimePage.appendStep()

    step.setBeforeText @initialPrompt
    step.setSubmissibilityCriterion ["textLengthIsAtLeast", 1, ["responseField", 1]]
    step.setResponseTemplate responseTemplate

    pane.addToStep(step) for pane in @page.panes


class CorrectableSequenceWithFeedback

  HIGHLIGHT_COLOR: '#1f77b4'

  constructor: ({@initialPrompt, @hints, @giveUp, @confirmCorrect, @page}) ->
    if typeof @initialPrompt is 'string' then @initialPrompt = { text: @initialPrompt } # TODO fix up the hobo app to generate a hash

    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']

  getRequiresGraphOrTable: ->
    @getHasVisualPrompts() || @getNeedsGraphData()

  getNeedsGraphData: ->
    false

  getHasVisualPrompts: ->
    for feedback in @hints.concat @initialPrompt, @giveUp, @confirmCorrect
      return true if feedback.visualPrompts?.length > 0
    false

  getCriterion: ->
    []

  getDataDefRef: (runtimeActivity) ->
    return null unless @graphPane?
    runtimeActivity.getDatadefRef "#{@page.index}-#{@graphPane.index}"

  appendStepsWithModifier: (runtimePage, modifyForSequenceType) ->
    if @getRequiresGraphOrTable() and not @graphPane? and not @tablePane? then throw new Error "Sequence requires at least one graph or table pane"

    runtimeActivity = runtimePage.activity
    @datadefRef = @getDataDefRef runtimeActivity

    steps = []
    answerableSteps = []

    addPanesAndFeedbackToStep = ({ step, from }) =>
      for pane in @page.panes
        pane.addToStep step

      step.setBeforeText from.text

      for prompt in from.visualPrompts ? []
        promptHash =
          type:       prompt.type
          datadefRef: @datadefRef
          color:      prompt.color
          x:          prompt.point?[0] ? undefined
          y:          prompt.point?[1] ? undefined
          xMin:       prompt.xMin ? -Infinity
          xMax:       prompt.xMax ? Infinity
          axis:       prompt.axis?.replace "_axis", ""

        step.addAnnotationToPane
          annotation: runtimeActivity.createAndAppendAnnotation promptHash
          index:      @graphPane.index

    for answerableInfo in (if @hints then [@initialPrompt].concat @hints else [@initialPrompt])
      steps.push step = runtimePage.appendStep()
      answerableSteps.push step
      addPanesAndFeedbackToStep { step, from: answerableInfo }

    steps.push giveUpStep = runtimePage.appendStep()
    addPanesAndFeedbackToStep { step: giveUpStep, from: @giveUp }

    steps.push confirmCorrectStep = runtimePage.appendStep()
    addPanesAndFeedbackToStep { step: confirmCorrectStep, from: @confirmCorrect }

    lastAnswerableStep = answerableSteps[answerableSteps.length-1]

    for step, index in answerableSteps
      modifyForSequenceType step
      step.setSubmitButtonTitle "Check My Answer"

      step.appendResponseBranch
        criterion: @getCriterion()
        step:      confirmCorrectStep

      if step is lastAnswerableStep
        step.setDefaultBranch giveUpStep
      else
        step.setDefaultBranch answerableSteps[index+1]


Sequence.classFor['PickAPointSequence'] = class PickAPointSequence extends CorrectableSequenceWithFeedback

  constructor: ({@correctAnswerPoint, @correctAnswerRange}) ->
    super arguments...

  getRequiresGraphOrTable: ->
    true

  getCriterion: ->
    return ["coordinates=", @tag.name, @correctAnswerPoint[0], @correctAnswerPoint[1]] if @correctAnswerPoint?
    return ["coordinatesInRange", @tag.name, @correctAnswerRange.xMin, @correctAnswerRange.yMin, @correctAnswerRange.xMax, @correctAnswerRange.yMax]

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    datadefRef = @getDataDefRef runtimeActivity
    @tag = runtimeActivity.createAndAppendTag()
    @highlightedPoint = runtimeActivity.createAndAppendAnnotation { type: "HighlightedPoint", datadefRef, @tag, color: @HIGHLIGHT_COLOR }

    modifierForSequenceType = (step) =>
      step.addTaggingTool { @tag, @datadefRef }
      if @graphPane? then step.addAnnotationToPane { annotation: @highlightedPoint, index: @graphPane.index }
      if @tablePane? then step.addAnnotationToPane { annotation: @highlightedPoint, index: @tablePane.index }

    @appendStepsWithModifier runtimePage, modifierForSequenceType


Sequence.classFor['NumericSequence'] = class NumericSequence extends CorrectableSequenceWithFeedback

  constructor: ({@correctAnswer}) ->
    super arguments...
    
  getCriterion: ->
    ["=",["responseField", 1], @correctAnswer]

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate "NumericResponseTemplate"

    modifierForSequenceType = (step) =>
      step.setSubmissibilityCriterion ["isNumeric", ["responseField", 1]]
      step.setResponseTemplate responseTemplate

    @appendStepsWithModifier runtimePage, modifierForSequenceType
