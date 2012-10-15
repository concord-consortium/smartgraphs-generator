{AuthorPane}          = require './author-panes'

exports.LineConstructionSequence = class LineConstructionSequence
  
  getDataDefRef: (runtimeActivity) ->
    return null unless @graphPane?
    runtimeActivity.getDatadefRef "#{@graphPane.activeDatasetName}"

  setupStep: ({runtimePage, stepdef}) ->
    step = @runtimeStepsByName[stepdef.name]
    step.addGraphPane
      title: @graphPane.title
      datadefRef: @graphPane.datadefRef
      xAxis: @xAxis
      yAxis: @yAxis
      index: @graphPane.index
      showCrossHairs: stepdef.showCrossHairs
      showGraphGrid: stepdef.showGraphGrid
      showToolTipCoords: stepdef.showToolTipCoords
      includedDataSets: @graphPane.includedDataSets
      activeDatasetName: @graphPane.activeDatasetName
      dataRef: if @graphPane.dataRef then @graphPane.dataRef else []
    step.addTablePane
      datadefRef: @getDataDefRef(runtimePage.activity)
      index: @tablePane.index
      xLabel: @tablePane.xLabel
      yLabel: @tablePane.yLabel
    
    step.beforeText = stepdef.beforeText
    step.substitutedExpressions = stepdef.substitutedExpressions
    step.variableAssignments = stepdef.variableAssignments
    step.submitButtonTitle = stepdef.submitButtonTitle
    step.defaultBranch = @runtimeStepsByName[stepdef.defaultBranch]
    step.setSubmissibilityCriterion stepdef.submissibilityCriterion

    for annotation in stepdef.graphAnnotations || []
      if @annotations[annotation]
        step.addAnnotationToPane
          annotation: @annotations[annotation]
          index:      @graphPane.index
    
    for tool in stepdef.tools || []
      step.addGraphingTool 
        index: @index || 0
        datadefRef: @getDataDefRef(runtimePage.activity)
        annotation: @annotations["singleLineGraphing"]
        shape: "singleLine"
           
    step.defaultBranch = @runtimeStepsByName[stepdef.defaultBranch]
    for response_def in stepdef.responseBranches || []
      step.appendResponseBranch
        criterion: response_def.criterion
        step: @runtimeStepsByName[response_def.step]
    step
  
  check_correct_answer:->
    [
      {
        "criterion": ["and", [ "withinAbsTolerance", @slope, ["lineSlope", @annotations["singleLineGraphing"].name, 1], @slopeTolerance],
                    [ "withinAbsTolerance", @yIntercept, ["yIntercept", @annotations["singleLineGraphing"].name, 1], @yInterceptTolerance] ],
        "step": "confirm_correct"
      },
      {
        "criterion": [ "withinAbsTolerance", @slope, ["lineSlope", @annotations["singleLineGraphing"].name, 1], @slopeTolerance ],
        "step": "incorrect_answer_but_slope_correct"
      },
      {
        "criterion": [ "withinAbsTolerance", @yIntercept, ["yIntercept", @annotations["singleLineGraphing"].name, 1], @yInterceptTolerance ] ,
        "step": "incorrect_answer_but_y_intercept_correct"
      }
    ]
    
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
    @page,
    @dataSetName
    }) ->
    @steps = []
    @runtimeStepsByName = {}
    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor["PredefinedGraphPane"]
      @tablePane = pane if pane instanceof AuthorPane.classFor["TablePane"]

    if @dataSetName then @graphPane.activeDatasetName = @dataSetName
 
  appendSteps: (runtimePage) ->
    @annotations = {}
  
    @yAxis    = @graphPane.yAxis
    @xAxis    = @graphPane.xAxis
    
    @x_axis_name = @xAxis.label.toLowerCase()
    @y_axis_name = @yAxis.label.toLowerCase()
    
    runtimeActivity = runtimePage.activity
    @datadefRef      = @getDataDefRef runtimeActivity
    @tags = {}
    @annotations = {}
    
    otherAnnotations = [{ name: "singleLineGraphing",    type: "FreehandSketch"    }]
    for annotation in otherAnnotations
      @annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation {type: "FreehandSketch"}
    @assemble_steps()
    for stepdef in @steps
      runtimeStep = runtimePage.appendStep()
      @runtimeStepsByName[stepdef.name] = runtimeStep
    for stepdef in @steps
      @setupStep
        stepdef: stepdef
        runtimePage: runtimePage
  
  first_question: ->
    { ############################################
      ##         first_question             ##
      ############################################
      name:                         "question"
      defaultBranch:                "incorrect_answer_all"
      submitButtonTitle:            "Check My Answer"
      beforeText:                   @initialPrompt
      substitutedExpressions:       []
      submissibilityCriterion:      ["=", ["lineCount"], 1]
      showCrossHairs:               @graphPane.showCrossHairs
      showToolTipCoords :           @graphPane.showToolTipCoords
      showGraphGrid     :           @graphPane.showGraphGrid
      graphAnnotations:             ["singleLineGraphing"]
      tableAnnotations:             []
      tools:                        ["graphing"]
      responseBranches:             @check_correct_answer()
    } 
    
  incorrect_answer_all: ->
    {
      name:                        "incorrect_answer_all"
      defaultBranch:               "incorrect_answer_all" 
      submitButtonTitle:           "Check My Answer"
      beforeText:                  "<b>#{@allIncorrect}</b><p>#{@initialPrompt}</p>"
      substitutedExpressions:      []
      submissibilityCriterion:     ["or", ["pointMoved", @datadefRef.datadef.name, 1 ], ["pointMoved", @datadefRef.datadef.name, 2 ]]
      showCrossHairs:              false
      showToolTipCoords :          @graphPane.showToolTipCoords
      showGraphGrid     :          @graphPane.showGraphGrid
      graphAnnotations:            ["singleLineGraphing"]
      tableAnnotations:            []
      tools:                       ["graphing"]
      responseBranches:            @check_correct_answer()
    }
  incorrect_answer_but_y_intercept_correct: ->
    {
      name:                        "incorrect_answer_but_y_intercept_correct"
      defaultBranch:               "incorrect_answer_all" 
      submitButtonTitle:           "Check My Answer"
      beforeText:                  "<b>#{@slopeIncorrect}</b><p>#{@initialPrompt}</p>"
      substitutedExpressions:      []
      submissibilityCriterion:     ["or", ["pointMoved", @datadefRef.datadef.name, 1 ], ["pointMoved", @datadefRef.datadef.name, 2 ]]
      showCrossHairs:              false
      showToolTipCoords :          @graphPane.showToolTipCoords
      showGraphGrid     :          @graphPane.showGraphGrid
      graphAnnotations  :          ["singleLineGraphing"]
      tableAnnotations:            []
      tools:                       ["graphing"]
      responseBranches:            @check_correct_answer()
    }    
  incorrect_answer_but_slope_correct: ->
    {
      name:                       "incorrect_answer_but_slope_correct"
      defaultBranch:              "incorrect_answer_all" 
      submitButtonTitle:          "Check My Answer"
      beforeText:                 "<b>#{@yInterceptIncorrect}</b><p>#{@initialPrompt}</p>"
      substitutedExpressions:     []
      submissibilityCriterion:    ["or", ["pointMoved", @datadefRef.datadef.name, 1 ], ["pointMoved", @datadefRef.datadef.name, 2 ]]  
      showCrossHairs:             false
      showToolTipCoords:          @graphPane.showToolTipCoords
      showGraphGrid    :          @graphPane.showGraphGrid
      graphAnnotations:           ["singleLineGraphing"]
      tableAnnotations:           []
      tools:                      ["graphing"]
      responseBranches:           @check_correct_answer()
    }
  confirm_correct: ->
    {
      name:                   "confirm_correct"
      isFinalStep:            true  
      hideSubmitButton:       true
      beforeText:             "<b>#{@confirmCorrect}</b>"
      showCrossHairs:         false
      showToolTipCoords:      false
      showGraphGrid:          @graphPane.showGraphGrid
      graphAnnotations  :     ["singleLineGraphing"]
    }
   
  assemble_steps: ->
    @steps.push(@first_question())
    @steps.push(@incorrect_answer_all())
    @steps.push(@incorrect_answer_but_y_intercept_correct())
    @steps.push(@incorrect_answer_but_slope_correct())
    @steps.push(@confirm_correct())
