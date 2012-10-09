(function() {
  var AuthorPane, SlopeToolSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.SlopeToolSequence = SlopeToolSequence = (function() {

    SlopeToolSequence.prototype.select_first_point_first_time_text = function() {
      var results;
      results = "";
      if (this.firstQuestionIsSlopeQuestion) results = this.incorrect_text();
      results = "" + results + "\n" + (this.select_first_point_text());
      return results;
    };

    SlopeToolSequence.prototype.ending_text = function() {
      return "" + this.xMax + (this.xUnits.length > 0 ? this.xUnits : " for " + this.x_axis_name);
    };

    SlopeToolSequence.prototype.starting_text = function() {
      return "" + this.xMin + (this.xUnits.length > 0 ? this.xUnits : void 0);
    };

    SlopeToolSequence.prototype.click_ok_text = function() {
      return "<p>Then click \"OK\". </p>";
    };

    SlopeToolSequence.prototype.incorrect_text = function() {
      return "<p><strong>Incorrect.</strong></p>";
    };

    SlopeToolSequence.prototype.range_text = function(first_point) {
      if (first_point == null) first_point = true;
      if (this.selectedPointsMustBeAdjacent && !first_point) {
        return "a second <strong><em>adjacent</em></strong> \npoint between " + this.xMin + " and " + (this.ending_text()) + ".\n";
      } else if (this.studentMustSelectEndpointsOfRange) {
        if (first_point) {
          return "a point at \n<strong><em>one end</em></strong>  \nof the interval from\n" + (this.starting_text()) + " to " + (this.ending_text()) + ".";
        } else {
          return "the point at \n<strong><em>the other end</em></strong>  \nof the interval from\n" + (this.starting_text()) + " to " + (this.ending_text()) + ".";
        }
      } else {
        return "" + (first_point ? "a" : "a second") + " \npoint between " + this.xMin + " and " + (this.ending_text()) + ".";
      }
    };

    SlopeToolSequence.prototype.select_first_point_text = function() {
      return "<p> Click on " + (this.range_text()) + " </p>\n" + (this.click_ok_text());
    };

    SlopeToolSequence.prototype.first_point_wrong_text = function() {
      return "" + (this.incorrect_text()) + "\n<p>The point you have selected is not \n" + (this.range_text()) + "\nTry again.</p>\n" + (this.select_first_point_text());
    };

    SlopeToolSequence.prototype.select_second_point_text = function(first_time) {
      if (first_time == null) first_time = true;
      return "<p>Now click on\n" + (this.range_text(false)) + "</p>\n" + (this.click_ok_text());
    };

    SlopeToolSequence.prototype.second_point_out_of_range_text = function() {
      return "" + (this.incorrect_text()) + "\n<p> The point you have selected is not \n" + (this.range_text()) + "  \nTry again.</p>\n" + (this.select_second_point_text());
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
      var criterion;
      if (pointName == null) pointName = this.secondPoint.name;
      if (axis == null) axis = 'x';
      if (max == null) max = this.xMax;
      if (min == null) min = this.xMin;
      criterion = ["or", ["<", ["coord", axis, pointName], min], [">", ["coord", axis, pointName], max]];
      if (this.studentMustSelectEndpointsOfRange) {
        criterion = ["and", ["!=", ["coord", axis, pointName], min], ["!=", ["coord", axis, pointName], max]];
      }
      return {
        criterion: criterion,
        step: dest
      };
    };

    SlopeToolSequence.prototype.point_in_range = function(dest, pointName, axis, max, min) {
      var criterion;
      if (pointName == null) pointName = this.firstPoint.name;
      if (axis == null) axis = 'x';
      if (max == null) max = this.xMax;
      if (min == null) min = this.xMin;
      criterion = ["and", [">=", ["coord", axis, pointName], min], ["<=", ["coord", axis, pointName], max]];
      if (this.studentMustSelectEndpointsOfRange) {
        criterion = ["or", ["=", ["coord", axis, pointName], min], ["=", ["coord", axis, pointName], max]];
      }
      return {
        criterion: criterion,
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
      results.push(this.point_not_in_range('second_point_out_of_range'));
      return results;
    };

    SlopeToolSequence.prototype.check_correct_slope = function(use_points) {
      var slope;
      if (use_points == null) use_points = true;
      if (use_points) {
        slope = ["slope", this.firstPoint.name, this.secondPoint.name];
      } else {
        slope = this.slope;
      }
      return [
        {
          criterion: ["withinAbsTolerance", ["responseField", 1], slope, this.tolerance],
          step: "confirm_correct"
        }
      ];
    };

    function SlopeToolSequence(_arg) {
      var i, pane, _len, _ref;
      this.firstQuestionIsSlopeQuestion = _arg.firstQuestionIsSlopeQuestion, this.studentSelectsPoints = _arg.studentSelectsPoints, this.selectedPointsMustBeAdjacent = _arg.selectedPointsMustBeAdjacent, this.studentMustSelectEndpointsOfRange = _arg.studentMustSelectEndpointsOfRange, this.slopeVariableName = _arg.slopeVariableName, this.firstQuestion = _arg.firstQuestion, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.tolerance = _arg.tolerance, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      this.precision = 2;
      if (!(this.slopeVariableName && this.slopeVariableName.length > 0)) {
        this.slopeVariableName = "slope";
      }
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
      if (this.dataSetName) this.graphPane.activeDatasetName = this.dataSetName;
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
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index + "-" + this.graphPane.activeDataSetIndex);
    };

    SlopeToolSequence.prototype.setupStep = function(_arg) {
      var annotation, responseTemplate, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: this.graphPane.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        includedDataSets: this.graphPane.includedDataSets,
        activeDatasetName: this.graphPane.activeDatasetName
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
      var annotation, color, datadefRef, otherAnnotations, point, runtimeActivity, runtimeStep, stepdef, x_units_abbr, y_units_abbr, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results;
      this.xUnits = "";
      this.yUnits = "";
      this.in_xUnits = "";
      this.in_yUnits = "";
      this.slope_units = "";
      this.in_slope_units = "";
      if (this.graphPane.yUnits) {
        this.yUnits = " " + (this.graphPane.yUnits.toLowerCase());
        this.xUnits = " " + (this.graphPane.xUnits.toLowerCase());
        this.in_xUnits = " in " + this.xUnits;
        this.in_yUnits = " in " + this.yUnits;
      }
      if (this.graphPane.xUnitsRef) {
        x_units_abbr = this.graphPane.xUnitsRef.unit.abbreviation;
        y_units_abbr = this.graphPane.yUnitsRef.unit.abbreviation;
        this.slope_units = " " + y_units_abbr + "/" + x_units_abbr;
        this.in_slope_units = " in" + this.slope_units;
      }
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      this.firstPoint = runtimeActivity.createAndAppendTag();
      this.firstPoint.datadefName = datadefRef.name;
      this.firstPoint.x = this.xMin;
      this.firstPoint.y = this.yMin;
      this.secondPoint = runtimeActivity.createAndAppendTag();
      this.secondPoint.datadefName = datadefRef.name;
      this.secondPoint.x = this.xMax;
      this.secondPoint.y = this.yMax;
      if (!this.studentSelectsPoints) {
        this.firstPoint.x = this.xMin;
        this.firstPoint.y = this.yMin;
        this.secondPoint.x = this.xMax;
        this.secondPoint.y = this.yMax;
      }
      runtimePage.addSlopeVars(this.firstPoint, this.secondPoint, this.precision);
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
          namePrefix: annotation.name,
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
      var _ref;
      if (this.firstQuestionIsSlopeQuestion) return this.firstQuestion;
      return "What was the " + this.slopeVariableName + " between the two points" + ((_ref = this.in_slope_units) != null ? _ref : "") + "?";
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
        responseBranches: this.check_correct_slope(false)
      };
    };

    SlopeToolSequence.prototype.select_first_point = function() {
      return {
        name: "select_first_point",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: this.select_first_point_first_time_text(),
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [this.point_in_range("select_second_point")]
      };
    };

    SlopeToolSequence.prototype.if_first_point_wrong = function() {
      return {
        name: "if_first_point_wrong",
        defaultBranch: "if_first_point_wrong",
        submitButtonTitle: "OK",
        beforeText: this.first_point_wrong_text(),
        graphAnnotations: ["" + this.firstPoint.name],
        tableAnnotations: ["" + this.firstPoint.name],
        tools: [
          {
            tag: this.firstPoint.name
          }
        ],
        responseBranches: [this.point_in_range("select_second_point")]
      };
    };

    SlopeToolSequence.prototype.select_second_point = function() {
      return {
        name: "select_second_point",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: this.select_second_point_text(),
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
        beforeText: "" + (this.incorrect_text()) + "\n<p> Your points should be adjacent.</p>\n" + (this.select_second_point_text()),
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
        beforeText: "" + (this.incorrect_text()) + "\n<p> You have selected the same point twice.</p>\n" + (this.select_second_point_text()),
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

    SlopeToolSequence.prototype.second_point_out_of_range = function() {
      return {
        name: "second_point_out_of_range",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "OK",
        beforeText: this.second_point_out_of_range_text(),
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
        beforeText: "" + (this.incorrect_text()) + "\n<p> " + (this.lineAppearsQuestion()) + " </p>\n<p>Hint: Recall that the " + this.slopeVariableName + " is \nthe change in  " + this.y_axis_name + "\ndivided by the change in " + this.x_axis_name + ".</p>",
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.y_axis_name + " between the two points" + this.in_yUnits + "?</p>\n<p>Hint: Look at the graph.</p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.y_axis_name + " between the two points" + this.in_yUnits + "?</p>\n<p>Hint: Look at the table and the graph.</p>",
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>The change" + this.in_yUnits + " is\n<b>%@</b> - <b>%@</b>, \nor <b>%@</b>.</p>",
        substitutedExpressions: ["end-y", "start-y", "change-y"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["rise-arrow"],
        highLightedTableAnnotations: ["rise-bracket"]
      };
    };

    SlopeToolSequence.prototype.ask_for_run = function() {
      return {
        name: "ask_for_run",
        defaultBranch: "if_run_wrong_1",
        submitButtonTitle: "Check My Answer",
        responseTemplate: "" + this.response_template + "/numeric",
        beforeText: "<p>What was the change in\n" + this.x_axis_name + " between the two points" + this.in_xUnits + "?</p>\n<p>Hint: Look at the graph.</p>",
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line", "rise-arrow"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        highLightedGraphAnnotations: ["run-arrow"],
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>What was the change in\n" + this.x_axis_name + " between the two points" + this.in_xUnits + "?</p>\n<p>Hint: Look at the graph and the table.</p>",
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>The change" + this.in_xUnits + " \nbetween the points is <b>%@</b> - <b>%@</b>, \nor <b>%@</b>.</p>",
        substitutedExpressions: ["end-x", "start-x", "change-x"],
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
        beforeText: "<p>\n  If the change in " + this.y_axis_name + " is %@" + this.yUnits + "\n  and the change in " + this.x_axis_name + " is %@" + this.xUnits + "\n  then what is the " + this.slopeVariableName + this.in_slope_units + "?\n</p>",
        substitutedExpressions: ["change-y", "change-x"],
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
        beforeText: "" + (this.incorrect_text()) + "\n<p>\n  If the change in " + this.y_axis_name + " is %@" + this.yUnits + "\n  and the change in " + this.x_axis_name + " is %@" + this.xUnits + "\n  then what is the " + this.slopeVariableName + this.in_slope_units + "?\n</p>\n<p>\n  Hint: Remember that it is \n  the change in " + this.y_axis_name + " \n  <b>divided by</b> \n  the change in " + this.x_axis_name + ".\n</p>",
        substitutedExpressions: ["change-y", "change-x"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name],
        variableAssignments: this.previous_answers(),
        submissibilityCriterion: this.require_numeric_input(),
        responseBranches: this.check_correct_slope()
      };
    };

    SlopeToolSequence.prototype.give_up_slope_calculation = function() {
      return {
        name: "give_up_slope_calculation",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "" + (this.incorrect_text()) + "\n<p>\nIf the change in " + this.y_axis_name + " is %@" + this.yUnits + "\nand the change in " + this.x_axis_name + " is %@" + this.xUnits + ",\nthe " + this.slopeVariableName + " is \n<b>%@</b> divided by <b>%@</b>, \nor <b>%@</b>" + this.slope_units + ".</p>",
        substitutedExpressions: ["change-y", "change-x", "change-y", "change-x", "slope_str"],
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"],
        tableAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name]
      };
    };

    SlopeToolSequence.prototype.confirm_correct = function() {
      var subs_expr, the_slope;
      the_slope = "%@";
      subs_expr = ["slope_str"];
      if (this.firstQuestionIsSlopeQuestion) {
        the_slope = this.slope.toFixed(this.precision);
        subs_expr = [];
      }
      return {
        name: "confirm_correct",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<p><b>Correct!</b></p>\n<p>The " + this.slopeVariableName + " is <b>" + the_slope + "</b>" + this.slope_units + ".</p>",
        substitutedExpressions: subs_expr,
        graphAnnotations: ["" + this.firstPoint.name, "" + this.secondPoint.name, "slope-line"]
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
        this.steps.push(this.second_point_out_of_range());
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
