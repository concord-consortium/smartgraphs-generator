{AuthorPane}          = require './author-panes'
# TODO: we could extend CorrectableSequenceWithFeedback
exports.SlopeToolSequence = class SlopeToolSequence

  select_first_point_first_time_text: () ->
    results = ""
    if @firstQuestionIsSlopeQuestion
      results = @incorrect_text()
    results = """
      #{results}
      #{@select_first_point_text()}
    """
    results
  
  ending_text: () ->
    "#{@xMax}#{if @xUnits.length > 0 then @xUnits else " for #{@x_axis_name}"}"
  
  starting_text: () ->
    "#{@xMin}#{if @xUnits.length > 0 then @xUnits}"

  click_ok_text: () ->
    "<p>Then click \"OK\". </p>"

  incorrect_text: () ->
    "<p><strong>Incorrect.</strong></p>"

  range_text: (first_point=true) ->
    if (@selectedPointsMustBeAdjacent and not first_point)
      """
        a second <strong><em>adjacent</em></strong> 
        point between #{@xMin} and #{@ending_text()}.
        
      """
    else if (@studentMustSelectEndpointsOfRange)
      # "Click on a point at one end of the interval from 0 hours to 5 hours."
      if first_point
        """
          a point at 
          <strong><em>one end</em></strong>  
          of the interval from
          #{@starting_text()} to #{@ending_text()}.
        """
      else
        """
          the point at 
          <strong><em>the other end</em></strong>  
          of the interval from
          #{@starting_text()} to #{@ending_text()}.
        """
    else
      """
        #{if first_point then "a" else "a second"} 
        point between #{@xMin} and #{@ending_text()}.
      """
  
  select_first_point_text: ()->
    """
      <p> Click on #{@range_text()} </p>
      #{@click_ok_text()}
    """
    
  first_point_wrong_text: () ->
    """
      #{@incorrect_text()}
      <p>The point you have selected is not 
      #{@range_text()}
      Try again.</p>
      #{@select_first_point_text()}
    """

  select_second_point_text: (first_time=true) ->
    """
      <p>Now click on
      #{@range_text(false)}</p>
      #{@click_ok_text()}
    """

  second_point_out_of_range_text: () ->
    """
      #{@incorrect_text()}
      <p> The point you have selected is not 
      #{@range_text()}  
      Try again.</p>
      #{@select_second_point_text()}
    """
  
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

  point_not_in_range: (dest, pointName=@secondPoint.name, axis='x', max=@xMax, min=@xMin) ->
    criterion = [    "or", [  "<", [ "coord", axis, pointName ], min ], [  ">", [ "coord", axis, pointName ], max ] ]
    if @studentMustSelectEndpointsOfRange
      criterion = [ "and", [ "!=", [ "coord", axis, pointName ], min ], [ "!=", [ "coord", axis, pointName ], max ] ]
    return {
      criterion: criterion
      step: dest
    }

  point_in_range: (dest, pointName=@firstPoint.name, axis='x', max=@xMax, min=@xMin) ->
    criterion = [ "and", [ ">=", [ "coord", axis, pointName ], min ], ["<=", [ "coord", axis, pointName ], max ] ]
    if @studentMustSelectEndpointsOfRange
      criterion = ["or", [ "=" , [ "coord", axis, pointName],  min ], [ "=", [ "coord", axis, pointName ], max ] ]
    return {
      criterion: criterion
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
    results.push(@point_not_in_range('second_point_out_of_range'))
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
    @page,
    @dataSetName
    }) ->
    @precision = 2; # TODO calculate or lookup precision from DB.
    @slopeVariableName = "slope" unless @slopeVariableName and @slopeVariableName.length > 0
    @runtimeStepsByName = {}
    @slope = (@yMax - @yMin) / (@xMax - @xMin)
    @steps=[]
    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
      @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']
      
    if @dataSetName then @graphPane.activeDatasetName = @dataSetName


  getRequiresGraphOrTable: ->
    true

  getNeedsGraphData: ->
    true
  
  getHasVisualPrompts: ->
    true

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
    @xUnits         = ""
    @yUnits         = ""
    @in_xUnits      = ""
    @in_yUnits      = ""
    @slope_units    = ""
    @in_slope_units = ""
    
    if (@graphPane.yUnits)
      @yUnits    = " #{@graphPane.yUnits.toLowerCase()}"
      @xUnits    = " #{@graphPane.xUnits.toLowerCase()}"
      @in_xUnits = " in #{@xUnits}"
      @in_yUnits = " in #{@yUnits}"
    if (@graphPane.xUnitsRef)
      # have to dig deep for the units abbreviation here...
      x_units_abbr    = @graphPane.xUnitsRef.unit.abbreviation
      y_units_abbr    = @graphPane.yUnitsRef.unit.abbreviation
      @slope_units    = " #{y_units_abbr}/#{x_units_abbr}"
      @in_slope_units = " in#{@slope_units}"

    @yAxis    = @graphPane.yAxis
    @xAxis    = @graphPane.xAxis
    
    @x_axis_name = @xAxis.label.toLowerCase()
    @y_axis_name = @yAxis.label.toLowerCase()

    runtimeActivity = runtimePage.activity
    datadefRef      = @getDataDefRef runtimeActivity
    
    @tags = {}
    @annotations = {}
    
    @firstPoint     = runtimeActivity.createAndAppendTag()
    @firstPoint.datadefName = datadefRef.name
    @firstPoint.x = @xMin
    @firstPoint.y = @yMin

    @secondPoint    = runtimeActivity.createAndAppendTag()
    @secondPoint.datadefName = datadefRef.name
    @secondPoint.x = @xMax
    @secondPoint.y = @yMax
   
    unless @studentSelectsPoints
      @firstPoint.x = @xMin
      @firstPoint.y = @yMin
      @secondPoint.x = @xMax
      @secondPoint.y = @yMax


    runtimePage.addSlopeVars(@firstPoint,@secondPoint,@precision)

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
        namePrefix: annotation.name
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
    return "What was the #{@slopeVariableName} between the two points#{@in_slope_units ? ""}?"

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
      beforeText:             @select_first_point_first_time_text()

      graphAnnotations: [ "#{@firstPoint.name}",]
      tableAnnotations: [ "#{@firstPoint.name}" ]
      tools:            [ tag: @firstPoint.name ]
      responseBranches: [ @point_in_range("select_second_point") ]
    }

  if_first_point_wrong: ->
    { ############################################
      ##         if_first_point_wrong             ##
      ############################################
      name:                   "if_first_point_wrong"
      defaultBranch:          "if_first_point_wrong"
      submitButtonTitle:      "OK"
      beforeText:              @first_point_wrong_text()

      graphAnnotations: [ "#{@firstPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}" ]
      tools:            [ tag: @firstPoint.name ]

      responseBranches: [ @point_in_range("select_second_point") ]
    }

  select_second_point: ->
    { ############################################
      ##         select_second_point               ##
      ############################################
      name:                   "select_second_point"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"
      beforeText:             @select_second_point_text()

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
        #{@incorrect_text()}
        <p> Your points should be adjacent.</p>
        #{@select_second_point_text()}
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
        #{@incorrect_text()}
        <p> You have selected the same point twice.</p>
        #{@select_second_point_text()}
      """
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
      tools:            [ tag: @secondPoint.name                                  ] 
      responseBranches: @second_point_response_branches()
    }

  second_point_out_of_range: ->
    { ############################################
      ##         second_point_out_of_range
      ############################################
      name:                   "second_point_out_of_range"
      defaultBranch:          "when_line_appears"
      submitButtonTitle:      "OK"    
      beforeText:             @second_point_out_of_range_text()

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
        #{@incorrect_text()}
        <p> #{@lineAppearsQuestion()} </p>
        <p>Hint: Recall that the #{@slopeVariableName} is 
        the change in  #{@y_axis_name}
        divided by the change in #{@x_axis_name}.</p>
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
        #{@incorrect_text()}
        <p>What was the change in
        #{@y_axis_name} between the two points#{@in_yUnits}?</p>
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
        #{@incorrect_text()}
        <p>What was the change in
        #{@y_axis_name} between the two points#{@in_yUnits}?</p>
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
        #{@incorrect_text()}
        <p>The change#{@in_yUnits} is
        <b>%@</b> - <b>%@</b>, 
        or <b>%@</b>.</p>
      """

      substitutedExpressions: [ "end-y", "start-y", "change-y"]
      
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
        #{@x_axis_name} between the two points#{@in_xUnits}?</p>
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
        #{@incorrect_text()}
        <p>What was the change in
        #{@x_axis_name} between the two points#{@in_xUnits}?</p>
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
        #{@incorrect_text()}
        <p>The change#{@in_xUnits} 
        between the points is <b>%@</b> - <b>%@</b>, 
        or <b>%@</b>.</p>
      """
      substitutedExpressions: [ "end-x", "start-x", "change-x"]

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
        <p>
          If the change in #{@y_axis_name} is %@#{@yUnits}
          and the change in #{@x_axis_name} is %@#{@xUnits}
          then what is the #{@slopeVariableName}#{@in_slope_units}?
        </p>
      """
      substitutedExpressions: [ "change-y", "change-x"]

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
        #{@incorrect_text()}
        <p>
          If the change in #{@y_axis_name} is %@#{@yUnits}
          and the change in #{@x_axis_name} is %@#{@xUnits}
          then what is the #{@slopeVariableName}#{@in_slope_units}?
        </p>
        <p>
          Hint: Remember that it is 
          the change in #{@y_axis_name} 
          <b>divided by</b> 
          the change in #{@x_axis_name}.
        </p>
      """
      substitutedExpressions: [ "change-y", "change-x"]
      
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
        #{@incorrect_text()}
        <p>
        If the change in #{@y_axis_name} is %@#{@yUnits}
        and the change in #{@x_axis_name} is %@#{@xUnits},
        the #{@slopeVariableName} is 
        <b>%@</b> divided by <b>%@</b>, 
        or <b>%@</b>#{@slope_units}.</p>
      """
      substitutedExpressions: [ 
        "change-y"
        "change-x"
        "change-y"
        "change-x"
        "slope_str"
      ]
      graphAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      tableAnnotations: [ "#{@firstPoint.name}", "#{@secondPoint.name}" ]
    }

  confirm_correct: ->
    
    # the slope is from user points:
    the_slope = "%@" 
    subs_expr = ["slope_str"]

    # the slope was known at the start.
    if @firstQuestionIsSlopeQuestion
      the_slope = @slope.toFixed(@precision)
      subs_expr = []

    { ############################################
      ##         confirm_correct
      ##
      ############################################
      name:                   "confirm_correct"
      isFinalStep:            true
      hideSubmitButton:       true
      beforeText:             """
        <p><b>Correct!</b></p>
        <p>The #{@slopeVariableName} is <b>#{the_slope}</b>#{@slope_units}.</p>
      """
      # substitutedExpressions: [ "student-response-field"]
      substitutedExpressions: subs_expr
      graphAnnotations:       [ "#{@firstPoint.name}", "#{@secondPoint.name}", "slope-line" ]
      # variableAssignments:  @previous_answers()
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
      @steps.push(@second_point_out_of_range())

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
    