{AuthorPane}          = require './author-panes'
{SlopeToolSequence}   = require './slope_tool_sequence'
{LineConstructionSequence} = require './line_construction_sequence' 
{BestFitSequence} = require './best_fit_sequence' 
asObject = (s) ->
  if typeof s is 'string' 
    text: s
  else
    s

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
    runtimeActivity = runtimePage.activity
    @annotations = []
    

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
    
    # Creating LabelSets
    for pane, i in @page.panes || []
      if pane.labelSets
        for labelSetName in pane.labelSets
          for runtimeLabelSet in runtimeActivity.labelSets
            if runtimeLabelSet.name is labelSetName
              labelsArray = []
              for label in runtimeLabelSet.labels
                label.type = 'Label'
                label.namePrefix = labelSetName
                labelObject = runtimeActivity.createAndAppendAnnotation label
                labelsArray.push labelObject.getUrl()
              annotation = runtimeActivity.createAndAppendAnnotation
                name: labelSetName
                labels: labelsArray
                type: 'LabelSet'
              step.addAnnotationToPane
                annotation: annotation
                index: i

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
    @initialPrompt = asObject @initialPrompt
    
  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate "ConstructedResponseTemplate", [@initialContent]

    step = runtimePage.appendStep()

    step.setBeforeText @initialPrompt.text
    step.setSubmissibilityCriterion ["textLengthIsAtLeast", 1, ["responseField", 1]]
    step.setResponseTemplate responseTemplate

    pane.addToStep(step) for pane in @page.panes


Sequence.classFor['MultipleChoiceWithCustomHintsSequence'] = class MultipleChoiceWithCustomHintsSequence

  constructor: ({@initialPrompt, @choices, @correctAnswerIndex, @hints, @confirmCorrect, @page}) ->
    [@initialPrompt, @confirmCorrect] = [@initialPrompt, @confirmCorrect].map asObject
    
    # FIXME? Underscore would be handy here.
    indexed = []
    indexed[hint.choiceIndex] = hint for hint in @hints

    @orderedHints = (hint for hint in indexed when hint?)

  getCriterionForChoice: (choiceIndex) ->
    ["=", ["responseField", 1], 1 + choiceIndex]
    

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate 'MultipleChoiceTemplate', [''], @choices

    steps = []
    answerableSteps = []
    hintStepsByChoiceIndex = []

    # make the steps
    for stepInfo in [@initialPrompt].concat(@orderedHints).concat [@confirmCorrect]
      step = runtimePage.appendStep()

      steps.push step
      answerableSteps.push step unless stepInfo is @confirmCorrect
      hintStepsByChoiceIndex[stepInfo.choiceIndex] = step unless stepInfo is @initialPrompt or stepInfo is @confirmCorrect
      confirmCorrectStep = step if stepInfo is @confirmCorrect
      
      pane.addToStep step for pane in @page.panes
      step.setBeforeText stepInfo.text


    # add branching, submit button, & multiple choice template to the answerable steps
    for step, index in answerableSteps
      step.setSubmitButtonTitle "Check My Answer"
      step.setSubmissibilityCriterion ["isNumeric", ["responseField", 1]]
      step.setResponseTemplate responseTemplate
      
      step.appendResponseBranch
        criterion: @getCriterionForChoice @correctAnswerIndex
        step:      confirmCorrectStep
        
      for hint in @orderedHints
        step.appendResponseBranch
          criterion: @getCriterionForChoice hint.choiceIndex
          step:      hintStepsByChoiceIndex[hint.choiceIndex]
          
      step.setDefaultBranch step    # shouldn't be possible, but do *something* in the event the response isn't an expected response
  

class CorrectableSequenceWithFeedback

  HIGHLIGHT_COLOR: '#1f77b4'

  constructor: ({@initialPrompt, @hints, @giveUp, @confirmCorrect, @page, @dataSetName}) ->
    [@initialPrompt, @giveUp, @confirmCorrect] = [@initialPrompt, @giveUp, @confirmCorrect].map asObject
    
    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']
      
    if @dataSetName then @graphPane.activeDatasetName = @dataSetName

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
    runtimeActivity.getDatadefRef "#{@graphPane.activeDatasetName}"

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

  constructor: ({@correctAnswer, @tolerance}) ->
    @tolerance = @tolerance ? 0.01
    super arguments...

    
  getCriterion: ->
    ["withinAbsTolerance",["responseField", 1], @correctAnswer, @tolerance]


  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate "NumericResponseTemplate"

    modifierForSequenceType = (step) =>
      step.setSubmissibilityCriterion ["isNumeric", ["responseField", 1]]
      step.setResponseTemplate responseTemplate

    @appendStepsWithModifier runtimePage, modifierForSequenceType
    

Sequence.classFor['MultipleChoiceWithSequentialHintsSequence'] = class MultipleChoiceWithSequentialHintsSequence extends CorrectableSequenceWithFeedback
  
  constructor: ({@correctAnswerIndex, @choices}) ->
    super arguments...
  
  getCriterion: ->
    ["=",["responseField", 1], 1 + @correctAnswerIndex]
  
  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    responseTemplate = runtimeActivity.createAndAppendResponseTemplate 'MultipleChoiceTemplate', [''], @choices
    
    modifierForSequenceType = (step) =>
      step.setSubmissibilityCriterion ["isNumeric", ["responseField", 1]]
      step.setResponseTemplate responseTemplate

    @appendStepsWithModifier runtimePage, modifierForSequenceType

Sequence.classFor['SlopeToolSequence'] = SlopeToolSequence
Sequence.classFor['LineConstructionSequence'] = LineConstructionSequence
Sequence.classFor['BestFitSequence'] = BestFitSequence
