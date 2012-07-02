{AuthorPane}          = require './author-panes'

exports.LineConstructionSequence = class LineConstructionSequence

  require_numeric_input: (dest) ->
    [ "isNumeric", [ "responseField", 0 ] ]

  getDataDefRef: (runtimeActivity) ->
    return null unless @graphPane?
    runtimeActivity.getDatadefRef "#{@page.index}-#{@graphPane.index}"

  setupStep: ({runtimePage, stepdef}) ->
    step = @runtimeStepsByName[stepdef.name]
    step.addGraphPane
      title: @graphPane.title
      datadefRef: @getDataDefRef(runtimePage.activity)
      xAxis: @xAxis
      yAxis: @yAxis
      index: @graphPane.index
    step.addTablePane
      datadefRef: @getDataDefRef(runtimePage.activity)
      index: @tablePane.index
    
    step.beforeText = stepdef.beforeText
    step.substitutedExpressions = stepdef.substitutedExpressions
    step.variableAssignments = stepdef.variableAssignments
    step.submitButtonTitle = stepdef.submitButtonTitle
    step.defaultBranch = @runtimeStepsByName[stepdef.defaultBranch]

  constructor: ({
    @slope,
    @slopeTolerance,
    @yIntercept,
    @yInterceptTolerance,
    @initialPrompt,
    @confirmCorrect,
    @slopeIncorrect,
    @yInterceptIncorrect,
    @allIncorrect,
    @showCrossHairs,
    @showToolTipCoords,
    @showGraphGrid,
    @page
    }) ->
    @steps = []
    @runtimeStepsByName = {}
    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']
 
  appendSteps: (runtimePage) ->
    @annotations = {}
  
    @yAxis    = @graphPane.yAxis
    @xAxis    = @graphPane.xAxis
    
    @x_axis_name = @xAxis.label.toLowerCase()
    @y_axis_name = @yAxis.label.toLowerCase()
    
    runtimeActivity = runtimePage.activity
    datadefRef      = @getDataDefRef runtimeActivity
   
    @assemble_steps()
    for stepdef in @steps
      runtimeStep = runtimePage.appendStep()
      isActiveInputPane = true
      previousAnnotation = @graphPane.annotation
      @graphPane.addToStep(runtimeStep, {isActiveInputPane, previousAnnotation})
      @runtimeStepsByName[stepdef.name] = runtimeStep

    for stepdef in @steps
      @setupStep
        stepdef: stepdef
        runtimePage: runtimePage
  
  first_question: ->
    { ############################################
      ##         first_question             ##
      ############################################
      name:                   "question_1"
      defaultBranch:          "when_line_appears" # Send to the to the default page that is correct answer page in our case 
      submitButtonTitle:      "Check My Answer"
      beforeText:             @initialPrompt
      substitutedExpressions: []
      submissibilityCriterion: @require_numeric_input()
      graphAnnotations: [ ]
      tableAnnotations: [ ]
      tools: [ ]
      #responseBranches: @check_correct_slope(false)# TODO BY ZEUS:here edit the conditions.(criteria)..
    } 
   
  assemble_steps: ->
    @steps.push(@first_question())
