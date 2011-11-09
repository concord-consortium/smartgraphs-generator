{AuthorPane} = require './author-panes'

Sequence = exports.Sequence =

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

      step.appendResponseBranch {
        criterion: ["coordinates=", tag.name, @correctAnswerPoint[0], @correctAnswerPoint[1]]
        step: confirmCorrectStep
      }

      if step is lastAnswerableStep
        step.setDefaultBranch giveUpStep
      else
        step.setDefaultBranch answerableSteps[index+1]
