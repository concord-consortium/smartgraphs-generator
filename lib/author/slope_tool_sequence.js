(function() {
  var AuthorPane, SlopeToolSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.SlopeToolSequence = SlopeToolSequence = (function() {

    SlopeToolSequence.prototype.selectFirstPointQuestion = function() {
      var results;
      results = "";
      if (this.firstQuestionIsSlopeQuestion) results = "<p>Incorrect.</p>";
      results = "" + results + "\n<p>Select a point between \"" + this.xMin + " and " + this.xMax + " \"" + this.yUnits + "\".</p>\n<p>Then click \"OK\". </p>";
      return results;
    };

    SlopeToolSequence.prototype.previous_answers = function() {
      return [
        {
          name: "student-response-field",
          value: ["responseField", 1]
        }
      ];
    };

    SlopeToolSequence.prototype.require_numeric_input = function(dest) {
      return ["isNumeric", ["responseField", 1]];
    };

    SlopeToolSequence.prototype.not_adjacent = function(dest, pointA, pointB) {
      if (pointA == null) pointA = this.firstPoint.name;
      if (pointB == null) pointB = this.secondPoint.name;
      return {
        criterion: ["!=", ["absDiff", ["indexInDataset", pointA], ["indexInDataset", pointB]], 1],
        step: dest
      };
    };

    SlopeToolSequence.prototype.same_point = function(dest, pointA, pointB) {
      if (pointA == null) pointA = this.firstPoint.name;
      if (pointB == null) pointB = this.secondPoint.name;
      return {
        criterion: ['samePoint', pointA, pointB],
        step: dest
      };
    };

    SlopeToolSequence.prototype.point_not_in_range = function(dest, pointName, axis, max, min) {
      if (pointName == null) pointName = this.firstPoint.name;
      if (axis == null) axis = 'x';
      if (max == null) max = this.xMax;
      if (min == null) min = this.xMin;
      return {
        criterion: ["or", ["<=", ["coord", axis, pointName], min], [">=", ["coord", axis, pointName], max]],
        step: dest
      };
    };

    SlopeToolSequence.prototype.first_slope_default_branch = function() {
      if (this.studentSelectsPoints) return "select_first_point";
      return "when_line_appears";
    };

    SlopeToolSequence.prototype.second_point_response_branches = function() {
      var results;
      results = [];
      if (this.selectedPointsMustBeAdjacent) {
        results.push(this.not_adjacent('second_point_not_adjacent_and_should_be'));
      }
      results.push(this.same_point('second_point_duplicate_point'));
      results.push(this.point_not_in_range('second_point_not_in_correct_range', this.secondPoint.name));
      return results;
    };

    SlopeToolSequence.prototype.check_correct_slope = function() {
      return [
        {
          criterion: ["withinAbsTolerance", ["responseField", 1], ["slope", this.firstPoint.name, this.secondPoint.name], this.tolerance],
          step: "confirm_correct"
        }
      ];
    };

    function SlopeToolSequence(_arg) {
      var i, pane, _len, _ref;
      this.firstQuestionIsSlopeQuestion = _arg.firstQuestionIsSlopeQuestion, this.studentSelectsPoints = _arg.studentSelectsPoints, this.selectedPointsMustBeAdjacent = _arg.selectedPointsMustBeAdjacent, this.studentMustSelectEndpointsOfRange = _arg.studentMustSelectEndpointsOfRange, this.slopeVariableName = _arg.slopeVariableName, this.firstQuestion = _arg.firstQuestion, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.tolerance = _arg.tolerance, this.page = _arg.page;
      this.runtimeStepsByName = {};
      this.slope = (this.yMax - this.yMin) / (this.xMax - this.xMin);
      this.steps = [];
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          this.tablePane = pane;
        }
      }
    }

    SlopeToolSequence.prototype.getRequiresGraphOrTable = function() {
      return true;
    };

    SlopeToolSequence.prototype.getNeedsGraphData = function() {
      return true;
    };

    SlopeToolSequence.prototype.getHasVisualPrompts = function() {
      return true;
    };

    SlopeToolSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };

    SlopeToolSequence.prototype.setupStep = function(_arg) {
      var annotation, responseTemplate, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: this.getDataDefRef(runtimePage.activity),
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index
      });
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      if (stepdef.responseTemplate) {
        responseTemplate = runtimePage.activity.createAndAppendResponseTemplate("NumericResponseTemplate");
        step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
        step.setResponseTemplate(responseTemplate);
      }
      _ref = stepdef.graphAnnotations || [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        annotation = _ref[_i];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref2 = stepdef.highLightedGraphAnnotations || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        annotation = _ref2[_j];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.graphPane.index
          });
        }
      }
      _ref3 = stepdef.tableAnnotations || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        annotation = _ref3[_k];
        if (this.annotations[annotation]) {
          step.addAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref4 = stepdef.highLightedTableAnnotations || [];
      for (_l = 0, _len4 = _ref4.length; _l < _len4; _l++) {
        annotation = _ref4[_l];
        if (this.annotations[annotation]) {
          step.addHighlightedAnnotationToPane({
            annotation: this.annotations[annotation],
            index: this.tablePane.index
          });
        }
      }
      _ref5 = stepdef.tools || [];
      for (_m = 0, _len5 = _ref5.length; _m < _len5; _m++) {
        tool = _ref5[_m];
        step.addTaggingTool({
          tag: this.tags[tool.tag],
          datadefRef: this.getDataDefRef(runtimePage.activity)
        });
      }
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      _ref6 = stepdef.responseBranches || [];
      _results = [];
      for (_n = 0, _len6 = _ref6.length; _n < _len6; _n++) {
        response_def = _ref6[_n];
        _results.push(step.appendResponseBranch({
          criterion: response_def.criterion,
          step: this.runtimeStepsByName[response_def.step]
        }));
      }
      return _results;
    };

    SlopeToolSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, color, datadefRef, otherAnnotations, point, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results;
      this.yUnits = this.graphPane.yUnits;
      this.xUnits = this.graphPane.xUnits;
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      this.firstPoint = runtimeActivity.createAndAppendTag();
      this.firstPoint.name = 'first-point';
      this.firstPoint.datadefName = datadefRef.name;
      this.secondPoint = runtimeActivity.createAndAppendTag();
      this.secondPoint.name = 'second-point';
      this.firstPoint.datadefName = datadefRef.name;
      if (!this.studentSelectsPoints) {
        this.firstPoint.x = this.xMin;
        this.firstPoint.y = this.yMin;
        this.secondPoint.x = this.xMax;
        this.secondPoint.y = this.yMax;
      }
      runtimePage.addSlopeVars(this.firstPoint, this.secondPoint);
      _ref = [this.firstPoint, this.secondPoint];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        point = _ref[_i];
        color = "#ff7f0e";
        if (this.firstPoint === point) color = "#1f77b4";
        this.tags[point.name] = point;
        this.annotations[point.name] = runtimeActivity.createAndAppendAnnotation({
          type: "HighlightedPoint",
          color: color,
          datadefRef: datadefRef,
          tag: point
        });
      }
      otherAnnotations = [
        {
          name: 'run-arrow',
          type: 'RunArrow'
        }, {
          name: 'rise-arrow',
          type: 'RiseArrow'
        }, {
          name: 'run-bracket',
          type: 'RunBracket'
        }, {
          name: 'rise-bracket',
          type: 'RiseBracket'
        }, {
          name: 'slope-line',
          type: 'LineThroughPoints',
          color: '#1f77b4'
        }
      ];
      for (_j = 0, _len2 = otherAnnotations.length; _j < _len2; _j++) {
        annotation = otherAnnotations[_j];
        this.annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation({
          type: annotation.type,
          name: annotation.name,
          datadefRef: datadefRef,
          color: annotation.color || '#cccccc',
          p1Tag: this.firstPoint,
          p2Tag: this.secondPoint
        });
      }
      this.assemble_steps();
      _ref2 = this.steps;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref3 = this.steps;
      _results = [];
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        stepdef = _ref3[_l];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        }));
      }
      return _results;
    };

    SlopeToolSequence.prototype.lineAppearsQuestion = function() {
      if (this.firstQuestionIsSlopeQuestion) return this.firstQuestion;
      return "What was the " + this.slopeVariableName + " between the two points in " + this.yUnits + " per " + this.xUnits + "?";
    };

    SlopeToolSequence.prototype.first_slope_question = function() {
      return {
        name: "first_slope_question",
        defaultBranch: this.first_slope_default_branch(),
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: this.firstQuestion,
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: [],
        tableAnnotations: [],
        tools: [],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.select_first_point = function() {
      return {
        name: "select_first_point",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: this.selectFirstPointQuestion(),
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [
          {
            criterion: ["and", [">=", ["coord", "x", this.firstPoint.name], this.xMin], ["<=", ["coord", "x", this.firstPoint.name], this.xMax]],
            step: "select_second_point"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_first_point_wrong = function() {
      return {
        name: "if_first_point_wrong",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: "<p>Incorrect.</p> \n<p>Select a point between \"" + this.xMin + " and " + this.xMax + " \"" + this.yUnits + "\".</p>\n<p>Then click \"OK\". </p>",
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [
          {
            criterion: ["and", [">=", ["coord", "x", this.firstPoint.name], this.xMin], ["<=", ["coord", "x", this.firstPoint.name], this.xMax]],
            step: "select_second_point"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.select_second_point = function() {
      return {
        name: "select_second_point",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "<p>Now select a second point between \n" + this.xMin + " and " + this.xMax + " " + this.yUnits + ".</p>\n<p>Then click \"OK\". </p>",
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_not_adjacent_and_should_be = function() {
      return {
        name: "second_point_not_adjacent_and_should_be",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "<p> Incorrect </p>\n<p> Your points should be adjacent.</p>\n<p> Select a second point between \n" + this.xMin + " and " + this.xMax + " " + this.yUnits + ".</p>\n<p>Then click \"OK\". </p>",
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_duplicate_point = function() {
      return {
        name: "second_point_duplicate_point",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "<p> Incorrect </p>\n<p> You have selected the same point twice.</p>\n<p> Now select a <em>second</em> point between \n" + this.xMin + " and " + this.xMax + " " + this.yUnits + ".</p>\n<p>Then click \"OK\". </p>",
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.second_point_not_in_correct_range = function() {
      return {
        name: "second_point_not_in_correct_range",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: "<p> Incorrect </p>\n<p> The point you have selected is not between\n" + this.xMin + " and " + this.xMax + " " + this.yUnits + ".  Try again.</p>\n<p> Select a second point <em>between \n" + this.xMin + " and " + this.xMax + " " + this.yUnits + "</em>.</p>\n<p>Then click \"OK\". </p>",
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        tools: [
          {
            tag: this.secondPoint.name
          }
        ],
        responseBranches: this.second_point_response_branches()
      };
    };

    SlopeToolSequence.prototype.when_line_appears = function() {
      return {
        name: "when_line_appears",
        defaultBranch: "slope_wrong_0",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p> Here is the line connecting the two points. </p>\n<p> " + (this.lineAppearsQuestion()) + " </p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_0 = function() {
      return {
        name: "slope_wrong_0",
        defaultBranch: "slope_wrong_ask_for_rise",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>Incorrect.</p>\n<p>Hint: recall that the slope is \nthe change in  " + this.yAxis.label + "\ndivided by the change in " + this.xAxis.label + ". </p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_ask_for_rise = function() {
      return {
        name: "slope_wrong_ask_for_rise",
        defaultBranch: "if_rise_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>Incorrect.</p>\n<p>What was the change in\n" + this.yAxis.label + " between the two points in " + this.yUnits + "?</p>\n<p>Hint: Look at the graph. </p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "y", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_run"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_rise_wrong_1 = function() {
      return {
        name: "if_rise_wrong_1",
        defaultBranch: "if_rise_wrong_2",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>Incorrect.</p>\n<p>Hint: Look at the table and the graph </p>",
        substitutedExpressions: [],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
        highLightedTableAnnotations: ["rise-bracket"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "y", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_run"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_rise_wrong_2 = function() {
      return {
        name: "if_rise_wrong_2",
        defaultBranch: "ask_for_run",
        submitButtonTitle: "Continue",
        beforeText: "<p><b>Incorrect.</b></p>\n<p>The change in " + this.yUnits + " is\n<b>%@</b> - <b>%@</b>, \nor <b>%@</b> %@.</p>",
        substitutedExpressions: ["end-y", "start-y", "change-y", "change-y-units"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        highLightedGraphAnnotations: ["rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedTableAnnotations: ["rise-bracket"]
      };
    };

    SlopeToolSequence.prototype.ask_for_run = function() {
      return {
        name: "ask_for_run",
        defaultBranch: "if_run_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>What was the change in\n" + this.xAxis.label + " between the two points in " + this.xUnits + "?</p>\n<p>Hint: Look at the graph. </p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "x", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_slope"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_run_wrong_1 = function() {
      return {
        name: "if_run_wrong_1",
        defaultBranch: "if_run_wrong_2",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>Incorrect.</p>\n<p>What was the change in\n" + this.xAxis.label + " between the two points in " + this.xUnits + "?</p>\n<p>Hint: Look at the graph. </p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
        highLightedTableAnnotations: ["run-bracket"],
        responseBranches: [
          {
            criterion: ["withinAbsTolerance", ["delta", "x", ["slopeToolOrder", this.firstPoint.name, this.secondPoint.name]], ["responseField", 1], this.tolerance],
            step: "ask_for_slope"
          }
        ]
      };
    };

    SlopeToolSequence.prototype.if_run_wrong_2 = function() {
      return {
        name: "if_run_wrong_2",
        defaultBranch: "ask_for_slope",
        submitButtonTitle: "Continue",
        beforeText: "<p><b>Incorrect.</b></p>\n<p>The change in " + this.xUnits + " \nbetween the points is <b>%@</b> - <b>%@</b>, \nor <b>%@</b> %@.</p>",
        substitutedExpressions: ["end-x", "start-x", "change-x", "change-x-units"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
        highLightedTableAnnotations: ["run-bracket"]
      };
    };

    SlopeToolSequence.prototype.ask_for_slope = function() {
      return {
        name: "ask_for_slope",
        defaultBranch: "slope_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>If the change in " + this.yAxis.label + " is %@ %@\n  and the change in " + this.xAxis.label + " is %@ %@ \n  then what is the " + this.slopeVariableName + "\n  in " + this.yUnits + " / " + this.xUnits + " ? </p>",
        substitutedExpressions: ["change-y", "change-y-units", "change-x", "change-x-units"],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.slope_wrong_1 = function() {
      return {
        name: "slope_wrong_1",
        defaultBranch: "give_up_slope_calculation",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p><b>Incorrect</b></p>\n<p>\n  If the change in " + this.yAxis.label + " is <b>%@</b> %@\n  and the change in " + this.xAxis.label + " is <b>%@</b> %@ \n  then what is the " + this.slopeVariableName + "\n  in " + this.yUnits + " / " + this.xUnits + " ?\n</p>\n<p>\n  Hint: Remember that it is \n  the change in " + this.yAxis.label + " \n  <b>devided by</b> \n  the change in " + this.xAxis.label + "\n</p>",
        substitutedExpressions: ["change-y", "change-y-units", "change-x", "change-x-units"],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.give_up_slope_calculation = function() {
      return {
        name: "give_up_slope_calculation",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<p><b>Incorrect.</b></p>\n<p>If the change in " + this.yAxis.label + " is <b>%@</b> %@ \nand the change in " + this.xAxis.label + " is <b>%@</b> %@, \nthe " + this.slopeVariableName + " is \n<b>%@</b> divided by <b>%@</b>, \nor <b>%@</b> %@.</p>",
        substitutedExpressions: ["change-y", "change-y-units", "change-x", "change-x-units", "change-y", "change-x", "answer-units"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name]
      };
    };

    SlopeToolSequence.prototype.confirm_correct = function() {
      return {
        name: "confirm_correct",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<p><b>Correct!.</b></p>\n<p>The " + this.slopeVariableName + " is \n<b>%@</b> \n<divided by <b>%@</b>, \nor <b>%@</b> %@.</p>",
        substitutedExpressions: ["student-response-field", "answer-units"],
        variableAssignments: this.previous_answers()
      };
    };

    SlopeToolSequence.prototype.assemble_steps = function() {
      if (this.firstQuestionIsSlopeQuestion) {
        this.steps.push(this.first_slope_question());
      }
      if (this.studentSelectsPoints) {
        this.steps.push(this.select_first_point());
        this.steps.push(this.if_first_point_wrong());
        this.steps.push(this.select_second_point());
        this.steps.push(this.second_point_not_adjacent_and_should_be());
        this.steps.push(this.second_point_duplicate_point());
        this.steps.push(this.second_point_not_in_correct_range());
      }
      this.steps.push(this.when_line_appears());
      this.steps.push(this.slope_wrong_0());
      this.steps.push(this.slope_wrong_ask_for_rise());
      this.steps.push(this.if_rise_wrong_1());
      this.steps.push(this.if_rise_wrong_2());
      this.steps.push(this.ask_for_run());
      this.steps.push(this.if_run_wrong_1());
      this.steps.push(this.if_run_wrong_2());
      this.steps.push(this.ask_for_slope());
      this.steps.push(this.slope_wrong_1());
      this.steps.push(this.give_up_slope_calculation());
      return this.steps.push(this.confirm_correct());
    };

    return SlopeToolSequence;

  })();

}).call(this);
