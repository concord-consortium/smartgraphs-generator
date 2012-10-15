(function() {
  var AuthorPane, LineConstructionSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LineConstructionSequence = LineConstructionSequence = (function() {

    LineConstructionSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    LineConstructionSequence.prototype.setupStep = function(_arg) {
      var annotation, response_def, runtimePage, step, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef;
      step = this.runtimeStepsByName[stepdef.name];
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: this.graphPane.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        showCrossHairs: stepdef.showCrossHairs,
        showGraphGrid: stepdef.showGraphGrid,
        showToolTipCoords: stepdef.showToolTipCoords,
        includedDataSets: this.graphPane.includedDataSets,
        activeDatasetName: this.graphPane.activeDatasetName,
        dataRef: this.graphPane.dataRef ? this.graphPane.dataRef : []
      });
      step.addTablePane({
        datadefRef: this.getDataDefRef(runtimePage.activity),
        index: this.tablePane.index,
        xLabel: this.tablePane.xLabel,
        yLabel: this.tablePane.yLabel
      });
      step.beforeText = stepdef.beforeText;
      step.substitutedExpressions = stepdef.substitutedExpressions;
      step.variableAssignments = stepdef.variableAssignments;
      step.submitButtonTitle = stepdef.submitButtonTitle;
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      step.setSubmissibilityCriterion(stepdef.submissibilityCriterion);
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
      _ref2 = stepdef.tools || [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        tool = _ref2[_j];
        step.addGraphingTool({
          index: this.index || 0,
          datadefRef: this.getDataDefRef(runtimePage.activity),
          annotation: this.annotations["singleLineGraphing"],
          shape: "singleLine"
        });
      }
      step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
      _ref3 = stepdef.responseBranches || [];
      for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
        response_def = _ref3[_k];
        step.appendResponseBranch({
          criterion: response_def.criterion,
          step: this.runtimeStepsByName[response_def.step]
        });
      }
      return step;
    };

    LineConstructionSequence.prototype.check_correct_answer = function() {
      return [
        {
          "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
          "step": "confirm_correct"
        }, {
          "criterion": ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance],
          "step": "incorrect_answer_but_slope_correct"
        }, {
          "criterion": ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance],
          "step": "incorrect_answer_but_y_intercept_correct"
        }
      ];
    };

    function LineConstructionSequence(_arg) {
      var i, pane, _len, _ref;
      this.slope = _arg.slope, this.slopeTolerance = _arg.slopeTolerance, this.yIntercept = _arg.yIntercept, this.yInterceptTolerance = _arg.yInterceptTolerance, this.initialPrompt = _arg.initialPrompt, this.confirmCorrect = _arg.confirmCorrect, this.slopeIncorrect = _arg.slopeIncorrect, this.yInterceptIncorrect = _arg.yInterceptIncorrect, this.allIncorrect = _arg.allIncorrect, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      this.steps = [];
      this.runtimeStepsByName = {};
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor["PredefinedGraphPane"]) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor["TablePane"]) {
          this.tablePane = pane;
        }
      }
      if (this.dataSetName) this.graphPane.activeDatasetName = this.dataSetName;
    }

    LineConstructionSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      this.tags = {};
      this.annotations = {};
      otherAnnotations = [
        {
          name: "singleLineGraphing",
          type: "FreehandSketch"
        }
      ];
      for (_i = 0, _len = otherAnnotations.length; _i < _len; _i++) {
        annotation = otherAnnotations[_i];
        this.annotations[annotation.name] = runtimeActivity.createAndAppendAnnotation({
          type: "FreehandSketch"
        });
      }
      this.assemble_steps();
      _ref = this.steps;
      for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
        stepdef = _ref[_j];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref2 = this.steps;
      _results = [];
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        }));
      }
      return _results;
    };

    LineConstructionSequence.prototype.first_question = function() {
      return {
        name: "question",
        defaultBranch: "incorrect_answer_all",
        submitButtonTitle: "Check My Answer",
        beforeText: this.initialPrompt,
        substitutedExpressions: [],
        submissibilityCriterion: ["=", ["lineCount"], 1],
        showCrossHairs: this.graphPane.showCrossHairs,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_all = function() {
      return {
        name: "incorrect_answer_all",
        defaultBranch: "incorrect_answer_all",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.allIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_y_intercept_correct = function() {
      return {
        name: "incorrect_answer_but_y_intercept_correct",
        defaultBranch: "incorrect_answer_all",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.slopeIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_slope_correct = function() {
      return {
        name: "incorrect_answer_but_slope_correct",
        defaultBranch: "incorrect_answer_all",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.yInterceptIncorrect + "</b><p>" + this.initialPrompt + "</p>",
        substitutedExpressions: [],
        submissibilityCriterion: ["or", ["pointMoved", this.datadefRef.datadef.name, 1], ["pointMoved", this.datadefRef.datadef.name, 2]],
        showCrossHairs: false,
        showToolTipCoords: this.graphPane.showToolTipCoords,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"],
        tableAnnotations: [],
        tools: ["graphing"],
        responseBranches: this.check_correct_answer()
      };
    };

    LineConstructionSequence.prototype.confirm_correct = function() {
      return {
        name: "confirm_correct",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.confirmCorrect + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    LineConstructionSequence.prototype.assemble_steps = function() {
      this.steps.push(this.first_question());
      this.steps.push(this.incorrect_answer_all());
      this.steps.push(this.incorrect_answer_but_y_intercept_correct());
      this.steps.push(this.incorrect_answer_but_slope_correct());
      return this.steps.push(this.confirm_correct());
    };

    return LineConstructionSequence;

  })();

}).call(this);
