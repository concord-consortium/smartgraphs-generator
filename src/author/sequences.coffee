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

  appendSteps: (runtimePage) ->
    step = runtimePage.appendStep()
    pane.addToStep(step) for pane in @page.panes


Sequence.classFor['InstructionSequence'] = class InstructionSequence

  constructor: ({@text, @page}) ->

  appendSteps: (runtimePage) ->
    step = runtimePage.appendStep()
    step.setBeforeText @text
    pane.addToStep(step) for pane in @page.panes

class CorrectableSequenceWithFeedback
  HIGHLIGHT_COLOR: '#1f77b4'

  constructor: ({@initialPrompt, @correctAnswer, @correctAnswerPoint, @hints, @giveUp, @confirmCorrect, @page}) ->
    if typeof @initialPrompt is 'string' then @initialPrompt = { text: @initialPrompt } # TODO fix up the hobo app to generate a hash

    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']

  requiresGraphOrTable: () ->
    return hasVisualPrompts() || needsGraphData()

  needsGraphData: () ->
    false

  hasVisualPrompts: () ->
    for allFeedback in [@initialPrompt,@giveUp,@confirmCorrect].concat @hints
      if ((answerableInfo.visualPrompts ? []).length > 0)
        return true
    return false

  getAnswerableStepCriterion: () ->
    return []

  getDataDefRef: (runtimeActivity) ->
    runtimeActivity.getDatadefRef "#{@page.index}-#{@graphPane.index}"

  actualAppendSteps: (runtimePage, stepModifier) ->
    if @requiresGraphOrTable and not @graphPane? and not @tablePane? then throw new Error "Sequence requires at least one graph or table pane"

    runtimeActivity = runtimePage.activity
    @datadefRef = @getDataDefRef runtimeActivity

    steps = []
    answerableSteps = []

    addPanesAndFeedbackToStep = ({ step, from }) =>
      pane.addToStep(step) for pane in @page.panes
      step.setBeforeText from.text

      for prompt in from.visualPrompts ? []
        if prompt.type is 'RangeVisualPrompt'
          { color, xMin, xMax } = prompt
          xMin ?= -Infinity
          xMax ?= Infinity
          overlay = runtimeActivity.createAndAppendSegmentOverlay { @datadefRef, color, xMin, xMax }

          step.addAnnotationToPane { annotation: overlay, index: @graphPane.index }

    for answerableInfo in [@initialPrompt].concat @hints
      steps.push step = runtimePage.appendStep()
      answerableSteps.push step
      addPanesAndFeedbackToStep { step, from: answerableInfo }

    steps.push giveUpStep = runtimePage.appendStep()
    addPanesAndFeedbackToStep { step: giveUpStep, from: @giveUp }

    steps.push confirmCorrectStep = runtimePage.appendStep()
    addPanesAndFeedbackToStep { step: confirmCorrectStep, from: @confirmCorrect }

    lastAnswerableStep = answerableSteps[answerableSteps.length-1]

    for step, index in answerableSteps

      stepModifier(step)

      step.setSubmitButtonTitle "Check My Answer"

      step.appendResponseBranch {
        criterion: @getAnswerableStepCriterion()
        step: confirmCorrectStep
      }

      if step is lastAnswerableStep
        step.setDefaultBranch giveUpStep
      else
        step.setDefaultBranch answerableSteps[index+1]


Sequence.classFor['PickAPointSequence'] = class PickAPointSequence extends CorrectableSequenceWithFeedback
  requiresGraphOrTable: () ->
    return true

  getAnswerableStepCriterion: () ->
    return ["coordinates=", @tag.name, @correctAnswerPoint[0], @correctAnswerPoint[1]]

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    datadefRef = @getDataDefRef runtimeActivity
    @tag = runtimeActivity.createAndAppendTag()
    @highlightedPoint = runtimeActivity.createAndAppendHighlightedPoint { datadefRef, @tag, color: @HIGHLIGHT_COLOR }

    stepModifier = (step) =>
      step.addTaggingTool { @tag, @datadefRef }
      if @graphPane? then step.addAnnotationToPane { annotation: @highlightedPoint, index: @graphPane.index }
      if @tablePane? then step.addAnnotationToPane { annotation: @highlightedPoint, index: @tablePane.index }

    @actualAppendSteps(runtimePage, stepModifier)

Sequence.classFor['NumericSequence'] = class NumericSequence extends CorrectableSequenceWithFeedback
  getAnswerableStepCriterion: () ->
    return ["=",["responseField", 1], @correctAnswer]

  appendSteps: (runtimePage) ->

    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate "NumericResponseTemplate"

    stepModifier = (step) =>
      step.setSubmissibilityCriterion ["isNumeric", ["responseField", 1]]
      step.setResponseTemplate responseTemplate

    @actualAppendSteps(runtimePage, stepModifier)