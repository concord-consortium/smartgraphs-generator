# TODO: we could extend CorrectableSequenceWithFeedback
class SlopeToolSequence

  RBNotAdjacent: (dest, pointA=@pointA, pointB=@pointB) ->
    {
      criterion:
        ["=", 
          ["absDiff", 
            ["indexInDataset", pointA] 
            ["indexInDataset", pointB] 
            1
          ]
        ]
      step: dest
    }

  RBSamePoint: (dest, pointA=@pointA, pointB=@pointB) ->
    { 
      criterion: ['samePoint', pointA, pointB ]
      step: dest
    }

  RBPointNotWithinRange: (dest, pointName=@pointA, axis='x', max=@xMax, min=@xMin) ->
    {
      criterion: [ "or", [ "<=", [ "coord", axis, pointName ], min ], [ ">=", [ "coord", axis, pointName ], max ] ]
      step: dest
    }

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
      @pointA = 'first-point'
      @pointB = 'second-point'
      # TODO: lookup the graph units up in the runtime page.
      @yUnits = 'Meters'
      @xUnits = 'Seconds'
      @yAxis  = 'Position'
      @xAxis  = 'Time'

      @slope = (@yMax - @yMin) / (@xMax - @xMin)
      for pane, i in @page.panes || []
        @graphPane = pane if pane instanceof AuthorPane.classFor['PredefinedGraphPane']
        @tablePane = pane if pane instanceof AuthorPane.classFor['TablePane']
    
      # sequential list of declarative steps
      @steps = this.assemble_steps()

  getRequiresGraphOrTable: () ->
    true

  getNeedsGraphData: () ->
    true
  
  getHasVisualPrompts: () ->
    true

  getDataDefRef: (runtimeActivity) ->
    return null unless @graphPane?
    runtimeActivity.getDatadefRef "#{@page.index}-#{@graphPane.index}"
  
  appendStep: (runtimePage, name) ->
    step = runtimePage.appendStep()
    step.panes = @panes
    @stepsByName[name] = step
    step

  addAnnotations: (step,name) ->
    annotations
    step.addAnnotationToPane

  appendSteps: (runtimePage) ->
    for name in @stepNames
      step = appendStep(runtimePage,name)
      @addAnnotations(step,name)
      @addTools(step,name)
  
  lineAppearsQuestion: () ->
    @firstQuestionIsSlopeQuestion ? @firstQuestion : 
      "What was the #{@slopeVariableName} between the two points in #{@yUnits} per #{@xUnits}?"

  assemble_steps: () ->
    [
      { ############################################
        ##         1st_slope_question             ##
        ############################################
        name:                   "1st_slope_question"
        defaultBranch:          (@studentSelectsPoints ? "select_1st_point" : "when_line_appears")
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             @firstQuestion
        substitutedExpressions: []
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [
          "isNumeric", [ "responseField", 1 ] 
        ]
        graphAnnotations: [ "students-segment-labels" ]
        tableAnnotations: [ ]
        tools: [ ]
        responseBranches: [
          criterion: [ 
            "withinAbsTolerance", [ "responseField", 1 ], @slope, @tolerance 
          ],
          step: "confirm_correct"
        ]
      },
      { ############################################
        ##         select_1st_point               ##
        ############################################
        name:                   "select_1st_point"
        defaultBranch:          "if_1st_point_wrong"
        submitButtonTitle:      "OK"
        beforeText:             """
          #{(@firstQuestionIsSlopeQuestion ? "<p>Incorrect.</p>" : "" )} 
          <p>Select a point between "#{@xMin} and #{@xMax} "#{@yUnits}".</p>
          <p>Then click "OK". </p>
        """
        substitutedExpressions: [ "student-response-field" ]
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [
          "isNumeric", [ "responseField", 1 ]
        ]
        graphAnnotations: [ "p1-highlight", "students-segment-labels" ]
        tableAnnotations: [ "p1-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointA
            data: "position-data"
        ]
        responseBranches: [
          criterion: [ "and", [ ">=", [ "coord", "x", @pointA ], @xMin], [ "<=", [ "coord", "x", @pointA ], @xMax ] ]
          step: "select_2nd_point"
        ]
      },
      { ############################################
        ##         if_1st_point_wrong             ##
        ############################################
        name:                   "if_1st_point_wrong"
        defaultBranch:          "if_1st_point_wrong"
        submitButtonTitle:      "OK"
        beforeText:             """
          <p>Incorrect.</p> 
          <p>Select a point between "#{@xMin} and #{@xMax} "#{@yUnits}".</p>
          <p>Then click "OK". </p>
        """

        graphAnnotations: [
          "p1-highlight"
          "students-segment-labels"
          "segment-6-9s"
        ]
        tableAnnotations: [ "p1-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointA
            data: "position-data"
        ]
        responseBranches: [
          criterion: [ "and", [ ">=", [ "coord", "x", @pointA ], @xMin ], [ "<=", [ "coord", "x", @pointA ], @xMax ] ]
          step: "select_2nd_point"
        ]
      },
      { ############################################
        ##         select_2nd_point               ##
        ############################################
        name:                   "select_2nd_point"
        defaultBranch:          "when_line_appears"
        submitButtonTitle:      "OK"
        beforeText:             """
          <p>Now select a second point between 
          #{@xMin} and #{@xMax} #{@yUnits}.</p>
          <p>Then click "OK". </p>
        """
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointB
            data: "position-data"
        ]
        responseBranches: [
          RBNotAdjacent('2nd_point_not_adjacent_and_should_be')
          RBSamePoint('2nd_point_duplicate_point')
          RBPointNotWithinRange('2nd_point_not_in_correct_range',@pointB)
        ]
      },
      { ############################################
        ##   2nd_point_not_adjacent_and_should_be             
        ############################################
        name:                   "2nd_point_not_adjacent_and_should_be"
        defaultBranch:          "when_line_appears"
        submitButtonTitle:      "OK"
        beforeText:             """
          <p> Incorrect </p>
          <p> Your points should be adjacent </p>
          <p>Select a second point between 
          #{@xMin} and #{@xMax} #{@yUnits}.</p>
          <p>Then click "OK". </p>
        """
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointB
            data: "position-data"
        ]
        responseBranches: [
          RBNotAdjacent('2nd_point_not_adjacent_and_should_be')
          RBSamePoint('2nd_point_duplicate_point')
          RBPointNotWithinRange('2nd_point_not_in_correct_range',@pointB)
        ]
      },
      { ############################################
        ##  2nd_point_duplicate_point             
        ############################################
        name:                   "2nd_point_duplicate_point"
        defaultBranch:          "when_line_appears"
        submitButtonTitle:      "OK"
        beforeText:             """
          <p> Incorrect </p>
          <p> You have selected the same point twice.</p>
          <p> Now select a <em>second</em> point between 
          #{@xMin} and #{@xMax} #{@yUnits}.</p>
          <p>Then click "OK". </p>
        """
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointB
            data: "position-data"
        ]
        responseBranches: [
          RBNotAdjacent('2nd_point_not_adjacent_and_should_be')
          RBSamePoint('2nd_point_duplicate_point')
          RBPointNotWithinRange('2nd_point_not_in_correct_range', @pointB)
        ]
      },
      { ############################################
        ##         2nd_point_not_in_correct_range
        ############################################
        name:                   "2nd_point_not_in_correct_range"
        defaultBranch:          "when_line_appears"
        submitButtonTitle:      "OK"    
        beforeText:             """
          <p> Incorrect </p>
          <p> The point you have selected is not between
          #{@xMin} and #{@xMax} #{@yUnits}.  Try again.</p>
          <p> Select a second point <em>between 
          #{@xMin} and #{@xMax} #{@yUnits}</em>.</p>
          <p>Then click "OK". </p>
        """
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        tools: [
          name: "tagging"
          setup:
            tag: @pointB
            data: "position-data"
        ]
        responseBranches: [
          RBNotAdjacent('2nd_point_not_adjacent_and_should_be')
          RBSamePoint('2nd_point_duplicate_point')
          RBPointNotWithinRange('2nd_point_not_in_correct_range', @pointB)
        ]
      }
      {
        name:                   "when_line_appears"
        defaultBranch:          "slope_wrong_1"
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p> Here is the line connecting the two points </p>
          <p> #{@lineAppearsQuestion()} </p>
        """
        substitutedExpressions: []
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ]]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line" ]      
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "responseField", 1 ], @slope, @tolerance]
          step: "confirm_correct"
        ]
      },
      { 
        ############################################
        ##         slope_wrong_1
        ############################################
        name:                   "slope_wrong_1"
        defaultBranch:          "slope_wrong_ask_for_rise"
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p>Incorrect.</p>
          <p>Hint: recall that the slope is 
          the change in 
          #{@yAxis}
           divided by the change in 
          #{@xAxis}.
        """
        substitutedExpressions: []
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ]]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line" ]      
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "responseField", 1 ], @slope, @tolerance]
          step: "confirm_correct"
        ]
      },
      { ############################################
        ##         slope_wrong_ask_for_rise
        ############################################
        name:                   "slope_wrong_ask_for_rise"
        defaultBranch:          ""
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p>Incorrect.</p>
          <p>What was the change in
          #{@yAxis} between the two points in #{@yUnits}?</p>
          <p>Hint: Look at the graph. </p>
        """
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ] ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]

        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "delta", "y", [ "slopeToolOrder", @pointA, @pointB ] ], [ "responseField", 1 ], @tolerance ] 
          step: "ask_for_run"
        ]
      },
      { ############################################
        ##         if_rise_wrong_1
        ############################################
        name:                   "if_rise_wrong_1"
        defaultBranch:          "if_rise_wrong_2"
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p>Incorrect.</p>
          <p>Hint: Look at the table and the graph </p>
        """
        substitutedExpressions: [

        ]
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [
          "isNumeric", [ "responseField", 1 ] 
        ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels"
        highLightedGraphAnnotations: [ "rise-arrow" ]
        tableAnnotations: ["p1-highlight", "p2-highlight"]
        highLightedTableAnnotations: [ "rise-bracket" ]
        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "delta", "y", [ "slopeToolOrder", @pointA, @pointB ] ], [ "responseField", 1 ], @tolerance ] ],
          step: "ask_for_run"
        ]
      },
      {
        ############################################
        ##         if_rise_wrong_2
        ############################################
        name:                   "if_rise_wrong_2"
        defaultBranch:          "ask_for_run"
        submitButtonTitle:      "Continue"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p><b>Incorrect.</b></p>
          <p>The change in #{@}
          <b>%@</b> - <b>%@</b>, 
          or <b>%@</b> %@.</p>
        """
        # these expressions are context-vars, set on the 
        # runtime page.
        substitutedExpressions: [ 
          "end-position"
          "start-position"
          "change-y"
          "change-y-units"
        ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels"]
        highLightedGraphAnnotations: [ "rise-arrow" ]
        tableAnnotations: ["p1-highlight", "p2-highlight"]
        highLightedTableAnnotations: [ "rise-bracket" ]
      },
      { ############################################
        ##         ask_for_run
        ############################################
        name:                   "ask_for_run"
        defaultBranch:          "if_run_wrong_1"
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p>What was the change in
          #{@xAxis} between the two points in #{@xUnits}?</p>
          <p>Hint: Look at the graph. </p>
        """
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ] ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line", "rise-arrow" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]

        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "delta", "x", [ "slopeToolOrder", @pointA, @pointB ] ], [ "responseField", 1 ], @tolerance]
          step: "ask_for_slope"
        ]
      },
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
          #{@xAxis} between the two points in #{@xUnits}?</p>
          <p>Hint: Look at the graph. </p>
        """
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ] ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line", "rise-arrow" ]
        highLightedGraphAnnotations: [ "run-arrow" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        highLightedTableAnnotations: [ "run-bracket" ]
        responseBranches: [
          criterion: [ "withinAbsTolerance", [ "delta", "x", [ "slopeToolOrder", @pointA, @pointB ] ], [ "responseField", 1 ], @tolerance]
          step: "ask_for_slope"
        ]
      },
      { ############################################
        ##         if_run_wrong_2
        ############################################
        name:                   "if_run_wrong_2"
        defaultBranch:          "ask_for_slope"
        submitButtonTitle:      "Continue"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p><b>Incorrect.</b></p>
          <p>The change in #{@xUnits} 
          between the points is <b>%@</b> - <b>%@</b>, 
          or <b>%@</b> %@.</p>"
        """
        substitutedExpressions: [ "end-time", "start-time", "change-x", "change-x-units" ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line", "rise-arrow" ]
        highLightedGraphAnnotations: [ "run-arrow" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        highLightedTableAnnotations: [ "run-bracket" ]
      },
      { ############################################
        ##         ask_for_slope
        ############################################
        name:                   "ask_for_slope"
        defaultBranch:          "slope_wrong_1"
        submitButtonTitle:      "Check My Answer"
        responseTemplate:       "#{@response_template}/numeric"
        beforeText:             """
          <p>If the change in #{@yAxix} is %@ %@
            and the change in #{@xAxis} is %@ %@ 
            then what is the #{@slopeVariableName}
            in #{@yUnits} / #{@xUnits} ? </p>
        """
        substitutedExpressions: [ 
          "change-y"
          "change-y-units"
          "change-x"
          "change-x-units" 
        ]

        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ] ]
        graphAnnotations: [ "p1-highlight", "p2-highlight", "students-segment-labels", "slope-line" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        responseBranches: [
          criterion: [ 
            "withinAbsTolerance", [ "responseField", 1 ], @slope, @tolerance
          ],
          step: "confirm_correct"
        ]
      },
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
            If the change in #{@yAxix} is <b>%@</b> %@
            and the change in #{@xAxis} is <b>%@</b> %@ 
            then what is the #{@slopeVariableName}
            in #{@yUnits} / #{@xUnits} ?
          </p>
          <p>
            Hint: Remember that it is 
            the change in #{@yAxis} 
            <b>devided by</b> 
            the change in #{@xAxis}
          </p>
        """
        substitutedExpressions: [ 
          "change-y"
          "change-y-units"
          "change-x"
          "change-x-units" 
        ]

        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
        submissibilityCriterion: [ "isNumeric", [ "responseField", 1 ] ]
        graphAnnotations: [ "p1-highlight", "p2-?brhighlight", "students-segment-labels", "slope-line" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
        responseBranches: [
          criterion: [ 
            "withinAbsTolerance", [ "responseField", 1 ], @slope, @tolerance
          ],
          step: "confirm_correct"
        ]
      },
      { ############################################
        ##         give_up_slope_calculation
        ############################################
        name:                   "give_up_slope_calculation"
        isFinalStep: true
        hideSubmitButton: true
        beforeText:             """
          <p><b>Incorrect.</b></p>
          <p>If the change in #{@yAxis} is <b>%@</b> %@ 
          and the change in #{@xAxis} is <b>%@</b> %@, 
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
          "answer-units" 
        ]
        graphAnnotations: [ "p1-highlight", "p2-?brhighlight", "students-segment-labels", "slope-line" ]
        tableAnnotations: [ "p1-highlight", "p2-highlight" ]
      },
      { ############################################
        ##         confirm_correct
        ############################################
        name:                   "confirm_correct"
        isFinalStep: true
        hideSubmitButton: true
        beforeText:             """
          <p><b>Correct!.</b></p>
          <p>The #{@slopeVariableName} is 
          <b>%@</b> 
          <divided by <b>%@</b>, 
          or <b>%@</b> %@.</p>
        """
        substitutedExpressions: [ 
          "student-response-field"
          "answer-units" 
        ]
        variableAssignments:     [
          name: "student-response-field",
          value: [ "responseField", 1 ] 
        ]
      }
    ]

