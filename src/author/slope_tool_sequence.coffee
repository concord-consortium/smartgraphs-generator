{AuthorPane}          = require './author-panes'
# TODO: we could extend CorrectableSequenceWithFeedback
exports.SlopeToolSequence = class SlopeToolSequence

  selectFirstPointQuestion: () ->
    results = ""
    if @firstQuestionIsSlopeQuestion
      results = "<p>Incorrect.</p>"
    results = """
      #{results}
      <p>Select a point between #{@xMin} and #{@xMax} #{@xUnits}.</p>
      <p>Then click "OK". </p>
    """
    results
  
  previous_answers: ->
    [
      name: "student-response-field",
      value: [ "responseField", 1 ] 
    ]

  require_numeric_input: (dest) ->
    [ "isNumeric", [ "responseField", 1 ] ]

  not_adjacent: (dest, pointA=@firstPoint.name, pointB=@secondPoint.name) ->
    {
      criterion:
        ["!=", 
          ["absDiff", 
            ["indexInDataset", pointA] 
            ["indexInDataset", pointB] 
          ]
          1
        ]
      step: dest
    }

  same_point: (dest, pointA=@firstPoint.name, pointB=@secondPoint.name) ->
    { 
      criterion: ['samePoint', pointA, pointB ]
      step: dest
    }

  point_not_in_range: (dest, pointName=@firstPoint.name, axis='x', max=@xMax, min=@xMin) ->
    {
      criterion: [ "or", [ "<=", [ "coord", axis, pointName ], min ], [ ">=", [ "coord", axis, pointName ], max ] ]
      step: dest
    }

  first_slope_default_branch: ->
    if @studentSelectsPoints
      return "select_first_point"
    return "when_line_appears"

  second_point_response_branches: ->
    results = []
    if @selectedPointsMustBeAdjacent
      results.push(@not_adjacent('second_point_not_adjacent_and_should_be')) 
    results.push(@same_point('second_point_duplicate_point'))
    results.push(@point_not_in_range('second_point_not_in_correct_range',@secondPoint.name))
    results

  check_correct_slope: (use_points=true) ->
    if use_points
      slope = ["slope", @firstPoint.name, @secondPoint.name]
    else
      slope = @slope # calculated in constructor
    [
      criterion: [ "withinAbsTolerance", [ "responseField", 1 ], slope, @tolerance]
      step: "confirm_correct"
    ]

  constructor: ({
    @firstQuestionIsSlopeQuestion,
    @studentSelectsPoints,
    @selectedPointsMustBeAdjacent,
    @studentMustSelectEndpointsOfRange,
    @slopeVariableName,
    @firstQuestion,
    @xMin,
    @xMax,
    @yMin,
    @yMax,
    @tolerance,
    @page
    }) ->

      @runtimeStepsByName = {}
      @slope = (@yMax - @yMin) / (@xMax - @xMin)
      @steps=[]
      for pane, i in @page.panes || []
        @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
        @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']


  getRequiresGraphOrTable: ->
    true

  getNeedsGraphData: ->
    true
  
  getHasVisualPrompts: ->
    true

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

    if stepdef.responseTemplate
      responseTemplate = runtimePage.activity.createAndAppendResponseTemplate "NumericResponseTemplate"
      step.setSubmissibilityCriterion stepdef.submissibilityCriterion
      step.setResponseTemplate responseTemplate

    for annotation in stepdef.graphAnnotations || []
      if @annotations[annotation]
        step.addAnnotationToPane
          annotation: @annotations[annotation]
          index:      @graphPane.index
    
    for annotation in stepdef.highLightedGraphAnnotations || []
      if @annotations[annotation]
        step.addHighlightedAnnotationToPane
          annotation: @annotations[annotation]
          index:      @graphPane.index

    for annotation in stepdef.tableAnnotations || []
      if @annotations[annotation]
        step.addAnnotationToPane
          annotation: @annotations[annotation]
          index:      @tablePane.index

    for annotation in stepdef.highLightedTableAnnotations || []
      if @annotations[annotation]
        step.addHighlightedAnnotationToPane
          annotation: @annotations[annotation]
          index:      @tablePane.index

    for tool in stepdef.tools || []
      step.addTaggingTool
        tag:        @tags[tool.tag]
        datadefRef: @getDataDefRef(runtimePage.activity)

    step.defaultBranch = @runtimeStepsByName[stepdef.defaultBranch]

    for response_def in stepdef.responseBranches || []
      step.appendResponseBranch
        criterion: response_def.criterion
        step: @runtimeStepsByName[response_def.step]

  appendSteps: (runtimePage) ->
    @yUnits   = @graphPane.yUnits
    @xUnits   = @graphPane.xUnits
    @yAxis    = @graphPane.yAxis
    @xAxis    = @graphPane.xAxis
    
    runtimeActivity = runtimePage.activity
    datadefRef      = @getDataDefRef runtimeActivity
    
    @tags = {}
    @annotations = {}
    
    @firstPoint     = runtimeActivity.createAndAppendTag()
    @firstPoint.name = 'first-point'
    @firstPoint.datadefName = datadefRef.name
    
    @secondPoint    = runtimeActivity.createAndAppendTag()
    @secondPoint.name = 'second-point'
    @firstPoint.datadefName = datadefRef.name

    unless @studentSelectsPoints
      @firstPoint.x = @xMin
      @firstPoint.y = @yMin
      @secondPoint.x = @xMax
      @secondPoint.y = @yMax

    runtimePage.addSlopeVars(@firstPoint,@secondPoint)

    for point in [@firstPoint,@secondPoint]
      color = "#ff7f0e"
      color = "#1f77b4" if @firstPoint is point
      @tags[point.name] = point
      @annotations[point.name] = runtimeActivity.createAndAppendAnnotation
        type: "HighlightedPoint"
        color: color
        datadefRef: datadefRef 
        tag: point
    
    otherAnnotations = [
      { name: 'run-arrow',    type: 'RunArrow'    }
      { name: 'rise-arrow',   type: 'RiseArrow'   }   
      { name: 'run-bracket',  type: 'RunBracket'  }
      { name: 'rise-bracket', type: 'RiseBracket' }
      { name: 'slope-line',   type: 'LineThroughPoints', color: '#1f77b4'}
    ]

    for annotation in otherAnnotations
      @annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation
        type: annotation.type
        name: annotation.name
        datadefRef: datadefRef
        color: annotation.color || '#cccccc'
        p1Tag: @firstPoint
        p2Tag: @secondPoint

    @assemble_steps()

    # first pass: create runtime steps, keep name index
    for stepdef in @steps
      runtimeStep = runtimePage.appendStep()
      @runtimeStepsByName[stepdef.name] = runtimeStep

    # second pass: configure the step with references.
    for stepdef in @steps
      @setupStep
        stepdef: stepdef
        runtimePage: runtimePage

  lineAppearsQuestion: ->
    return @firstQuestion if @firstQuestionIsSlopeQuestion
    return "What was the #{@slopeVariableName} between the two points in #{@yUnits} per #{@xUnits}?"

  first_slope_question: ->
    { ############################################
      ##         first_slope_question             ##
      ############################################
      name:                   "first_slope_question"
      defaultBranch:          @first_slope_default_branch()
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             @firstQuestion
      substitutedExpressions: []
      variableAssignments:    @previous_answers()
      submissibilityCriterion: @require_numeric_input()
      graphAnnotations: [ ]
      tableAnnotations: [ ]
      tools: [ ]
      responseBranches: @check_correct_slope(false)
    }

  select_first_point: ->
    { ############################################
      ##         select_first_point               ##
      ############################################
      name:                   "select_first_point"
      defaultBranch:          "if_first_point_wrong"
      submitButtonTitle:      "OK"
      beforeText:             @selectFirstPointQuestion()

      graphAnnotations: [ "#{@firstPoint.name}",]
      tableAnnotations: [ "#{@firstPoint.name}" ]
      tools:            [ tag: @firstPoint.name ]
      responseBranches: [
        criterion: [ "and", [ ">=", [ "coord", "x", @firstPoint.name ], @xMin], [ "<=", [ "coord", "x", @firstPoint.name ], @xMax ] ]
        step: "select_second_point"
      ]
    }

  if_first_point_wrong: ->
    { ############################################
      ##         if_first_point_wrong             ##
      ############################################
      name:                   "if_first_point_wrong"
      defaultBranch:          "if_first_point_wrong"
      submitButtonTitle:      "OK"
      beforeText:              """
        <p> Incorrect </p>
        <p> The point you have selected is not between
        #{@xMin} and #{@xMax} #{@xUnits}.  Try again.</p>
        <p> Select a second point <em>between 
        #{@xMin} and #{@xMax} #{@xUnits}</em>.</p>
        <p>Then click "OK". </p>
      """

      graphAnnotations: [ "#{@firstPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}" ]
      tools:            [ tag: @firstPoint.name ]

      responseBranches: [
        criterion: [ "and", [ ">=", [ "coord", "x", @firstPoint.name], @xMin ], [ "<=", [ "coord", "x", @firstPoint.name ], @xMax ] ]
        step: "select_second_point"
      ]
    }

  select_second_point: ->
    { ############################################
      ##         select_second_point               ##
      ############################################
      name:                   "select_second_point"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"
      beforeText:             """
        <p>Now select a second point between 
        #{@xMin} and #{@xMax} #{@xUnits}.</p>
        <p>Then click "OK". </p>
      """
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tools:            [ tag: @secondPoint.name                               ]
      responseBranches: @second_point_response_branches()
    }

  second_point_not_adjacent_and_should_be: ->
    { ############################################
      ##   second_point_not_adjacent_and_should_be             
      ############################################
      name:                   "second_point_not_adjacent_and_should_be"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"
      beforeText:             """
        <p> Incorrect </p>
        <p> Your points should be adjacent.</p>
        <p> Select a second point between 
        #{@xMin} and #{@xMax} #{@xUnits}.</p>
        <p>Then click "OK". </p>
      """
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tools:            [ tag: @secondPoint.name                                 ]
      responseBranches:  @second_point_response_branches()
      
    }
  
  second_point_duplicate_point: ->
    { ############################################
      ##  second_point_duplicate_point             
      ############################################
      name:                   "second_point_duplicate_point"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"
      beforeText:             """
        <p> Incorrect </p>
        <p> You have selected the same point twice.</p>
        <p> Now select a <em>second</em> point between 
        #{@xMin} and #{@xMax} #{@xUnits}.</p>
        <p>Then click "OK". </p>
      """
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tools:            [ tag: @secondPoint.name                                  ] 
      responseBranches: @second_point_response_branches()
    }

  second_point_not_in_correct_range: ->
    { ############################################
      ##         second_point_not_in_correct_range
      ############################################
      name:                   "second_point_not_in_correct_range"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"    
      beforeText:             """
        <p> Incorrect </p>
        <p> The point you have selected is not between
        #{@xMin} and #{@xMax} #{@xUnits}.  Try again.</p>
        <p> Select a second point <em>between 
        #{@xMin} and #{@xMax} #{@xUnits}</em>.</p>
        <p>Then click "OK". </p>
      """
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tools:            [ tag: @secondPoint.name                                  ]
      responseBranches: @second_point_response_branches()
    }

  when_line_appears: ->
    { ############################################
      ##         when_line_appears
      ############################################
      name:                   "when_line_appears"
      defaultBranch:          "slope_wrong_0"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p> Here is the line connecting the two points. </p>
        <p> #{@lineAppearsQuestion()} </p>
      """
      substitutedExpressions: []
      variableAssignments:      @previous_answers()
      submissibilityCriterion:  @require_numeric_input()

      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]      
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}"               ]

      responseBranches: @check_correct_slope()
    }

  slope_wrong_0: ->
    { ############################################
      ##         slope_wrong_0
      ############################################
      name:                   "slope_wrong_0"
      defaultBranch:          "slope_wrong_ask_for_rise"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>Incorrect.</p>
        <p> #{@lineAppearsQuestion()} </p>
        <p>Hint: recall that the slope is 
        the change in  #{@yAxis.label}
        divided by the change in #{@xAxis.label}.</p>
      """
      substitutedExpressions:  []
      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()

      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]      
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      responseBranches: @check_correct_slope()
    }

  slope_wrong_ask_for_rise: ->
    { ############################################
      ##         slope_wrong_ask_for_rise
      ############################################
      name:                   "slope_wrong_ask_for_rise"
      defaultBranch:          "if_rise_wrong_1"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>Incorrect.</p>
        <p>What was the change in
        #{@yAxis.label} between the two points in #{@yUnits}?</p>
        <p>Hint: Look at the graph.</p>
      """
      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()

      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      highLightedGraphAnnotations: [ "rise-arrow"   ]

      responseBranches: [
        criterion: [ "withinAbsTolerance", [ "delta", "y", [ "slopeToolOrder", @firstPoint.name, @secondPoint.name ] ], [ "responseField", 1 ], @tolerance ] 
        step: "ask_for_run"
      ]
    }

  if_rise_wrong_1: ->
    { ############################################
      ##         if_rise_wrong_1
      ############################################
      name:                   "if_rise_wrong_1"
      defaultBranch:          "if_rise_wrong_2"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>Incorrect.</p>
        <p>What was the change in
        #{@yAxis.label} between the two points in #{@yUnits}?</p>
        <p>Hint: Look at the table and the graph.</p>
      """
      substitutedExpressions: []
      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()

      graphAnnotations:            [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations:            [ "#{@firstPoint.name}", "#{@secondPoint.name}"               ]
      highLightedGraphAnnotations: [ "rise-arrow"   ]
      highLightedTableAnnotations: [ "rise-bracket" ]

      responseBranches: [
        criterion: [ "withinAbsTolerance", [ "delta", "y", [ "slopeToolOrder", @firstPoint.name, @secondPoint.name ] ], [ "responseField", 1 ], @tolerance ],
        step: "ask_for_run"
      ]
    }

  if_rise_wrong_2: ->
    {
      ############################################
      ##         if_rise_wrong_2
      ############################################
      name:                   "if_rise_wrong_2"
      defaultBranch:          "ask_for_run"
      submitButtonTitle:      "Continue"
      
      beforeText:             """
        <p><b>Incorrect.</b></p>
        <p>The change in #{@yUnits} is
        <b>%@</b> - <b>%@</b>, 
        or <b>%@</b> %@.</p>
      """

      substitutedExpressions: [ "end-y", "start-y", "change-y", "change-y-units"]
      
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: ["#{@firstPoint.name}", "#{@secondPoint.name}"                ]

      highLightedGraphAnnotations: [ "rise-arrow" ]
      highLightedTableAnnotations: [ "rise-bracket" ]
    }

  ask_for_run: ->
    { ############################################
      ##         ask_for_run
      ############################################
      name:                   "ask_for_run"
      defaultBranch:          "if_run_wrong_1"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>What was the change in
        #{@xAxis.label} between the two points in #{@xUnits}?</p>
        <p>Hint: Look at the graph.</p>
      """
      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}",  "slope-line", "rise-arrow" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      highLightedGraphAnnotations: [ "run-arrow"   ]      

      responseBranches: [
        criterion: [ "withinAbsTolerance", [ "delta", "x", [ "slopeToolOrder", @firstPoint.name, @secondPoint.name ] ], [ "responseField", 1 ], @tolerance]
        step: "ask_for_slope"
      ]
    }

  if_run_wrong_1: ->
    { ############################################
      ##         if_run_wrong_1
      ############################################
      name:                   "if_run_wrong_1"
      defaultBranch:          "if_run_wrong_2"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>Incorrect.</p>
        <p>What was the change in
        #{@xAxis.label} between the two points in #{@xUnits}?</p>
        <p>Hint: Look at the graph and the table.</p>
      """
      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()

      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line", "rise-arrow" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}"                             ]

      highLightedGraphAnnotations: [ "run-arrow"   ]
      highLightedTableAnnotations: [ "run-bracket" ]
      responseBranches: [
        criterion: [ "withinAbsTolerance", [ "delta", "x", [ "slopeToolOrder", @firstPoint.name, @secondPoint.name ] ], [ "responseField", 1 ], @tolerance]
        step: "ask_for_slope"
      ]
    }

  if_run_wrong_2: ->
    { ############################################
      ##         if_run_wrong_2
      ############################################
      name:                   "if_run_wrong_2"
      defaultBranch:          "ask_for_slope"
      submitButtonTitle:      "Continue"
      
      beforeText:             """
        <p><b>Incorrect.</b></p>
        <p>The change in #{@xUnits} 
        between the points is <b>%@</b> - <b>%@</b>, 
        or <b>%@</b> %@.</p>
      """
      substitutedExpressions: [ "end-x", "start-x", "change-x", "change-x-units" ]

      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line", "rise-arrow" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}"                             ]
      highLightedGraphAnnotations: [ "run-arrow" ]
      highLightedTableAnnotations: [ "run-bracket" ]
    }

  ask_for_slope: ->
    { ############################################
      ##         ask_for_slope
      ############################################
      name:                   "ask_for_slope"
      defaultBranch:          "slope_wrong_1"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText:             """
        <p>If the change in #{@yAxis.label} is %@ %@
          and the change in #{@xAxis.label} is %@ %@ 
          then what is the #{@slopeVariableName}
          in #{@yUnits} / #{@xUnits}?</p>
      """
      substitutedExpressions: [ "change-y", "change-y-units", "change-x", "change-x-units"]

      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      responseBranches: @check_correct_slope()
    }

  slope_wrong_1: ->
    { ############################################
      ##         slope_wrong_1
      ############################################
      name:                   "slope_wrong_1"
      defaultBranch:          "give_up_slope_calculation"
      submitButtonTitle:      "Check My Answer"
      responseTemplate:       "#{@response_template}/numeric"
      beforeText: """
        <p><b>Incorrect</b></p>
        <p>
          If the change in #{@yAxis.label} is <b>%@</b> %@
          and the change in #{@xAxis.label} is <b>%@</b> %@ 
          then what is the #{@slopeVariableName}
          in #{@yUnits} / #{@xUnits}?
        </p>
        <p>
          Hint: Remember that it is 
          the change in #{@yAxis.label} 
          <b>devided by</b> 
          the change in #{@xAxis.label}.
        </p>
      """
      substitutedExpressions: [ "change-y", "change-y-units", "change-x", "change-x-units"]
      
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]

      variableAssignments:     @previous_answers()
      submissibilityCriterion: @require_numeric_input()

      responseBranches: @check_correct_slope()
    }

  give_up_slope_calculation: ->
    { ############################################
      ##         give_up_slope_calculation
      ############################################
      name:                   "give_up_slope_calculation"
      isFinalStep: true
      hideSubmitButton: true
      beforeText:             """
        <p><b>Incorrect.</b></p>
        <p>If the change in #{@yAxis.label} is <b>%@</b> %@ 
        and the change in #{@xAxis.label} is <b>%@</b> %@, 
        the #{@slopeVariableName} is 
        <b>%@</b> divided by <b>%@</b>, 
        or <b>%@</b> %@.</p>
      """
      substitutedExpressions: [ 
        "change-y"
        "change-y-units"
        "change-x"
        "change-x-units"
        "change-y"
        "change-x"
        "slope"
        "slope-units"
      ]
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
    }

  confirm_correct: ->
    { ############################################
      ##         confirm_correct
      ############################################
      name:                   "confirm_correct"
      isFinalStep: true
      hideSubmitButton: true
      beforeText:             """
        <p><b>Correct!</b></p>
        <p>The #{@slopeVariableName} is <b>%@</b> %@.</p>
      """
      substitutedExpressions: [ "student-response-field", "slope-units" ]
      graphAnnotations:       [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      # variableAssignments:    @previous_answers()
    }
  

  assemble_steps: ->
    
    #cases A and C
    @steps.push(@first_slope_question()) if @firstQuestionIsSlopeQuestion

    #cases A and B
    if @studentSelectsPoints
      @steps.push(@select_first_point())
      @steps.push(@if_first_point_wrong())
      @steps.push(@select_second_point())
      @steps.push(@second_point_not_adjacent_and_should_be())
      @steps.push(@second_point_duplicate_point())
      @steps.push(@second_point_not_in_correct_range())

    #All cases
    @steps.push(@when_line_appears())
    @steps.push(@slope_wrong_0())
    @steps.push(@slope_wrong_ask_for_rise())
    @steps.push(@if_rise_wrong_1())
    @steps.push(@if_rise_wrong_2())
    @steps.push(@ask_for_run())
    @steps.push(@if_run_wrong_1())
    @steps.push(@if_run_wrong_2())
    @steps.push(@ask_for_slope())
    @steps.push(@slope_wrong_1())
    @steps.push(@give_up_slope_calculation())
    @steps.push(@confirm_correct())
    