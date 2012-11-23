{AuthorPane}          = require './author-panes'

exports.BestFitSequence = class BestFitSequence

  constructor: ({
    @type,
    @dataSetName,
    @learnerDataSet,
    @correctTolerance,
    @closeTolerance,
    @initialPrompt,
    @incorrectPrompt,
    @closePrompt,
    @confirmCorrect,
    @maxAttempts,
    @page
    }) ->
    if @maxAttempts is 0 then throw new Error "Number of attempts should be more than 0"
    @bestFitLineslope = 0
    @bestFitLineConstant = 0
    @bestFitLineDeviationMeanSquare = 0
    @bestFitLineDataDef
    @bestFitLineDataRef
    @bestFitLineColor
    @bestFitLineDataref
    @learnerDataSetColor = '#cc0000'
    @steps = []
    @specialSteps = []
    @runtimeStepsByName = {}
    @correctLineDataSetName = "CorrectLine-"+ @page.index
    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor["PredefinedGraphPane"]
      @tablePane = pane if pane instanceof AuthorPane.classFor["TablePane"]

    if @learnerDataSet then @graphPane.activeDatasetName = @learnerDataSet
    @maxAttempts = 1  unless @maxAttempts

  getDataDefRef: (runtimeActivity) ->
    return null unless @graphPane?
    runtimeActivity.getDatadefRef "#{@graphPane.activeDatasetName}"

  setupStep: ({runtimePage, stepdef, hasAnswer}) ->
    dataDefRefForStep = @graphPane.datadefRef
    step = @runtimeStepsByName[stepdef.name]
    stepDataDefRef = []
    stepIncludedDataSets = []
    stepDataRefs = []
    legendsDataset = [@learnerDataSet]
    if hasAnswer is "true"
      stepDataRefs = @graphPane.dataRef.concat(@bestFitLineDataRef)
      stepDataDefRef = @graphPane.datadefRef.concat({ key: @correctLineDataSetName, datadef: @bestFitLineDataDef })
      stepIncludedDataSets = @graphPane.includedDataSets.concat({ name: @correctLineDataSetName, inLegend: true })
      legendsDataset.push @correctLineDataSetName
    else
      stepDataRefs = if @graphPane.dataRef then @graphPane.dataRef else []
      stepDataDefRef = @graphPane.datadefRef
      stepIncludedDataSets = @graphPane.includedDataSets

    step.addGraphPane
      title: @graphPane.title
      datadefRef: stepDataDefRef
      xAxis: @xAxis
      yAxis: @yAxis
      index: @graphPane.index
      showCrossHairs: stepdef.showCrossHairs
      showGraphGrid: stepdef.showGraphGrid
      showToolTipCoords: stepdef.showToolTipCoords
      includedDataSets: stepIncludedDataSets
      activeDatasetName: @graphPane.activeDatasetName
      dataRef: stepDataRefs
      sequenceType: { title : "Sum of squares", type : "AvgSumOfDeviation", referenceDatadef : @dataSetName, legendDataSets: legendsDataset }
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

  check_correct_answer:(nCounter) ->
    criterianArray = []
    correctTolerance = @bestFitLineDeviationMeanSquare * @correctTolerance / 100
    closeTolerance = @bestFitLineDeviationMeanSquare * @closeTolerance / 100
    if((nCounter+1) < @maxAttempts)
      nextCloseCorrect = 'close_answer_after_'+(nCounter+1)+'_try'
      nextIncorrect = 'incorrect_answer_after_'+(nCounter+1)+'_try'
      criterianArray = [
                          {
                            "criterion": [ "withinAbsTolerance", @bestFitLineDeviationMeanSquare, ["deviationValue", @learnerDataSet], correctTolerance ],
                            "step": 'correct_answer'
                          },
                          {
                            "criterion": [ "withinAbsTolerance", @bestFitLineDeviationMeanSquare, ["deviationValue", @learnerDataSet], closeTolerance ] ,
                            "step": nextCloseCorrect
                          }
                        ] 
    else
      criterianArray = [
                          {
                            "criterion": [ "withinAbsTolerance", @bestFitLineDeviationMeanSquare, ["deviationValue", @learnerDataSet], correctTolerance ],
                            "step": 'correct_answer'
                          }
                        ]          

    criterianArray

  check_final_answer: ->
    [
      {
        "criterion": [ "withinAbsTolerance", @bestFitLineDeviationMeanSquare, ["deviationValue", @learnerDataSet], correctTolerance ],
        "step": 'correct_answer'
      }
    ]

  get_bestFitLine: (runtimeActivity, graphPane) ->

    dataPointSet = runtimeActivity.getDatadefRef "#{@dataSetName}"

    dataSet  = dataPointSet.datadef.points
    unless dataSet.length and dataSet.length > 5
      throw new Error "Not valid Dataset !!!!"
    @bestFitLineslope = 0
    @bestFitLineConstant = 0
    sumOfX = 0
    sumOfY = 0
    sumOfXY = 0
    sumOfSquareX = 0
    nPointCounter = 0
    i = 0
    while i < dataSet.length
      point = dataSet[i]
      sumOfX += point[0]
      sumOfY += point[1]
      sumOfXY += point[1] * point[0]
      sumOfSquareX += point[0] * point[0]
      nPointCounter++
      i++
    @bestFitLineslope = ((nPointCounter * sumOfXY)-(sumOfX * sumOfY))/((nPointCounter * sumOfSquareX)-(sumOfX * sumOfX))
    @bestFitLineConstant = ((sumOfSquareX * sumOfY) - (sumOfX * sumOfXY)) / ((nPointCounter * sumOfSquareX) - (sumOfX * sumOfX))

    nPointCounter = 0
    bestFitLineDeviation = 0
    j = 0
    while j < dataSet.length
      point = dataSet[j]
      ditanceOfPointFromBestFitLine = Math.abs((@bestFitLineslope * point[0]) - point[1] + @bestFitLineConstant)/Math.sqrt((@bestFitLineslope * @bestFitLineslope ) + 1)
      bestFitLineDeviation += (ditanceOfPointFromBestFitLine * ditanceOfPointFromBestFitLine) 
      nPointCounter++
      j++

    @bestFitLineDeviationMeanSquare = bestFitLineDeviation / nPointCounter
    sign = if @bestFitLineConstant is 0 then '+' else @bestFitLineConstant / Math.abs(@bestFitLineConstant)
    bestFitLineExpression = 'y = '+@bestFitLineslope+'x' + (if sign is 1 then '+' else '-') + Math.abs(@bestFitLineConstant)
    @bestFitLineColor = runtimeActivity.getNewColor()
    NewEmptyData = runtimeActivity.createNewEmptyDataRef(@correctLineDataSetName, bestFitLineExpression, 0.1, 0, @bestFitLineColor)
    @bestFitLineDataDef = NewEmptyData.dataDef
    @bestFitLineDataRef = NewEmptyData.dataRef
    runtimeActivity.setColorOfDatadef @dataSetName,@bestFitLineColor
    runtimeActivity.setColorOfDatadef @learnerDataSet,@learnerDataSetColor
    @bestFitLineDataDef

  appendSteps: (runtimePage) ->
    @annotations = {}

    @yAxis    = @graphPane.yAxis
    @xAxis    = @graphPane.xAxis

    @x_axis_name = @xAxis.label.toLowerCase()
    @y_axis_name = @yAxis.label.toLowerCase()

    runtimeActivity = runtimePage.activity
    @get_bestFitLine runtimeActivity, @graphPane
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
    for stepdef in @specialSteps
      runtimeStep = runtimePage.appendStep()
      @runtimeStepsByName[stepdef.name] = runtimeStep
    for stepdef in @steps
      @setupStep
        stepdef: stepdef
        runtimePage: runtimePage
    for stepdef in @specialSteps
      @setupStep
        stepdef: stepdef
        runtimePage: runtimePage
        hasAnswer: "true"

  first_question: ->
    { ############################################
      ##         first_question             ##
      ############################################
      name:                         "first_question"
      defaultBranch:                if @maxAttempts is 1 then "attempts_over" else "incorrect_answer_after_1_try"
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
      responseBranches:             @check_correct_answer(0)
    } 

  incorrect_answer_after_try: (nCounter) ->
    {
      name:                        "incorrect_answer_after_"+nCounter+"_try"
      defaultBranch:               if (nCounter+1) < @maxAttempts then "incorrect_answer_after_"+(nCounter+1)+"_try" else "attempts_over"
      submitButtonTitle:           "Check My Answer"
      beforeText:                  "<b>#{@incorrectPrompt}</b><p>#{@initialPrompt}</p>"
      substitutedExpressions:      []
      submissibilityCriterion:     ["or", ["pointMoved", @datadefRef.datadef.name, 1 ], ["pointMoved", @datadefRef.datadef.name, 2 ]]
      showCrossHairs:              false
      showToolTipCoords :          @graphPane.showToolTipCoords
      showGraphGrid     :          @graphPane.showGraphGrid
      graphAnnotations:            ["singleLineGraphing"]
      tableAnnotations:            []
      tools:                       ["graphing"]
      responseBranches:            @check_correct_answer(nCounter)
    }
  close_answer_after_try: (nCounter) ->
    {
      name:                        "close_answer_after_"+nCounter+"_try"
      defaultBranch:               if (nCounter+1) < @maxAttempts then "incorrect_answer_after_"+(nCounter+1)+"_try" else "attempts_over"
      submitButtonTitle:           "Check My Answer"
      beforeText:                  "<b>#{@closePrompt}</b><p>#{@initialPrompt}</p>"
      substitutedExpressions:      []
      submissibilityCriterion:     ["or", ["pointMoved", @datadefRef.datadef.name, 1 ], ["pointMoved", @datadefRef.datadef.name, 2 ]]
      showCrossHairs:              false
      showToolTipCoords :          @graphPane.showToolTipCoords
      showGraphGrid     :          @graphPane.showGraphGrid
      graphAnnotations  :          ["singleLineGraphing"]
      tableAnnotations:            []
      tools:                       ["graphing"]
      responseBranches:            @check_correct_answer(nCounter)
    }

  attempts_over: ->
    {
      name:                   "attempts_over"
      isFinalStep:            true  
      hideSubmitButton:       true
      beforeText:             "<b>Your estimate is incorrect.</b>"
      showCrossHairs:         false
      showToolTipCoords:      false
      showGraphGrid:          @graphPane.showGraphGrid
      graphAnnotations  :     ["singleLineGraphing"]
    }
  correct_answer: ->
    {
      name:                   "correct_answer"
      isFinalStep:            true  
      hideSubmitButton:       true
      beforeText:             "<b>#{@confirmCorrect}</b>"
      showCrossHairs:         false
      showToolTipCoords:      false
      showGraphGrid:          @graphPane.showGraphGrid
      graphAnnotations  :     ["singleLineGraphing"]
    }
  assemble_steps: ->
    nCounter = 1
    @steps.push(@first_question())

    while (nCounter) < @maxAttempts
      @steps.push(@incorrect_answer_after_try(nCounter))
      @steps.push(@close_answer_after_try(nCounter))
      nCounter++

    @specialSteps.push(@attempts_over())
    @specialSteps.push(@correct_answer())
