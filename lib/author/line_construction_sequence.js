(function() {
  var AuthorPane, LineConstructionSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LineConstructionSequence = LineConstructionSequence = (function() {

    function LineConstructionSequence(_arg) {
      var i, pane, _len, _ref;
      this.slope = _arg.slope, this.slopeTolerance = _arg.slopeTolerance, this.yIntercept = _arg.yIntercept, this.yInterceptTolerance = _arg.yInterceptTolerance, this.initialPrompt = _arg.initialPrompt, this.confirmCorrect = _arg.confirmCorrect, this.slopeIncorrect = _arg.slopeIncorrect, this.yInterceptIncorrect = _arg.yInterceptIncorrect, this.allIncorrect = _arg.allIncorrect, this.giveUp = _arg.giveUp, this.maxAttempts = _arg.maxAttempts, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      if (this.maxAttempts === 0) {
        throw new Error("Number of attempts should be more than 0");
      }
      this.correctLineDataRef;
      this.correctLineDataDef;
      this.correctLineColor;
      this.correctLineDataSetName = "CorrectLine-" + this.page.index;
      this.steps = [];
      this.specialSteps = [];
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
      if (!this.maxAttempts) this.maxAttempts = 1;
    }

    LineConstructionSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    LineConstructionSequence.prototype.setupStep = function(_arg) {
      var annotation, dataDefRefForStep, hasAnswer, legendsDataset, response_def, runtimePage, step, stepDataDefRef, stepDataRefs, stepIncludedDataSets, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef, hasAnswer = _arg.hasAnswer;
      dataDefRefForStep = this.graphPane.datadefRef;
      step = this.runtimeStepsByName[stepdef.name];
      stepDataDefRef = [];
      stepIncludedDataSets = [];
      stepDataRefs = [];
      legendsDataset = [this.learnerDataSet];
      if (hasAnswer === "true") {
        stepDataRefs = this.graphPane.dataRef.concat(this.correctLineDataRef);
        stepDataDefRef = dataDefRefForStep.concat({
          key: this.correctLineDataSetName,
          datadef: this.correctLineDataDef
        });
        stepIncludedDataSets = this.graphPane.includedDataSets.concat({
          name: this.correctLineDataSetName,
          inLegend: true
        });
        legendsDataset.push(this.correctLineDataSetName);
      } else {
        stepDataRefs = this.graphPane.dataRef ? this.graphPane.dataRef : [];
        stepDataDefRef = dataDefRefForStep;
        stepIncludedDataSets = this.graphPane.includedDataSets;
      }
      step.addGraphPane({
        title: this.graphPane.title,
        datadefRef: stepDataDefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.graphPane.index,
        showCrossHairs: stepdef.showCrossHairs,
        showGraphGrid: stepdef.showGraphGrid,
        showToolTipCoords: stepdef.showToolTipCoords,
        includedDataSets: stepIncludedDataSets,
        activeDatasetName: this.graphPane.activeDatasetName,
        dataRef: stepDataRefs
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

    LineConstructionSequence.prototype.check_correct_answer = function(nCounter) {
      var criterionArray, nextInterceptCorrect, nextSlopeCorrect;
      criterionArray = [];
      if ((nCounter + 1) < this.maxAttempts) {
        nextSlopeCorrect = 'incorrect_answer_but_slope_correct_after_' + (nCounter + 1) + '_try';
        nextInterceptCorrect = 'incorrect_answer_but_y_intercept_correct_after_' + (nCounter + 1) + '_try';
        criterionArray = [
          {
            "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
            "step": "confirm_correct"
          }, {
            "criterion": ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance],
            "step": nextSlopeCorrect
          }, {
            "criterion": ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance],
            "step": nextInterceptCorrect
          }
        ];
      } else {
        criterionArray = [
          {
            "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
            "step": "confirm_correct"
          }
        ];
      }
      return criterionArray;
    };

    LineConstructionSequence.prototype.check_final_answer = function() {
      return [
        {
          "criterion": ["and", ["withinAbsTolerance", this.slope, ["lineSlope", this.annotations["singleLineGraphing"].name, 1], this.slopeTolerance], ["withinAbsTolerance", this.yIntercept, ["yIntercept", this.annotations["singleLineGraphing"].name, 1], this.yInterceptTolerance]],
          "step": "confirm_correct"
        }
      ];
    };

    LineConstructionSequence.prototype.get_correctSlopeLine = function(runtimeActivity, graphPane) {
      var NewEmptyData, correctLineExpression, negated_sign_char;
      this.correctLineSlope = this.slope;
      this.correctLineIntercept = this.yIntercept;
      negated_sign_char = this.correctLineIntercept >= 0 ? '+' : '-';
      correctLineExpression = 'y = ' + this.correctLineSlope + 'x' + negated_sign_char + Math.abs(this.correctLineIntercept);
      this.correctLineColor = runtimeActivity.getNewColor();
      debugger;
      NewEmptyData = runtimeActivity.createNewEmptyDataRef(this.correctLineDataSetName, correctLineExpression, 0.1, 0, this.correctLineColor);
      this.correctLineDataDef = NewEmptyData.dataDef;
      this.correctLineDataRef = NewEmptyData.dataRef;
      return this.correctLineDataDef;
    };

    LineConstructionSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      this.get_correctSlopeLine(runtimeActivity, this.graphPane);
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
      _ref2 = this.specialSteps;
      for (_k = 0, _len3 = _ref2.length; _k < _len3; _k++) {
        stepdef = _ref2[_k];
        runtimeStep = runtimePage.appendStep();
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref3 = this.steps;
      for (_l = 0, _len4 = _ref3.length; _l < _len4; _l++) {
        stepdef = _ref3[_l];
        this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        });
      }
      _ref4 = this.specialSteps;
      _results = [];
      for (_m = 0, _len5 = _ref4.length; _m < _len5; _m++) {
        stepdef = _ref4[_m];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage,
          hasAnswer: "true"
        }));
      }
      return _results;
    };

    LineConstructionSequence.prototype.first_question = function() {
      return {
        name: "question",
        defaultBranch: this.maxAttempts === 1 ? "attempts_over" : "incorrect_answer_all_after_1_try",
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
        responseBranches: this.check_correct_answer(0)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_all_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_all_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
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
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_y_intercept_correct_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_but_y_intercept_correct_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
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
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.incorrect_answer_but_slope_correct_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_but_slope_correct_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_all_after_" + (nCounter + 1) + "_try" : "attempts_over",
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
        responseBranches: this.check_correct_answer(nCounter)
      };
    };

    LineConstructionSequence.prototype.attempts_over = function() {
      return {
        name: "attempts_over",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.giveUp + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
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
      var nCounter;
      nCounter = 1;
      this.steps.push(this.first_question());
      while (nCounter < this.maxAttempts) {
        this.steps.push(this.incorrect_answer_all_after_try(nCounter));
        this.steps.push(this.incorrect_answer_but_y_intercept_correct_after_try(nCounter));
        this.steps.push(this.incorrect_answer_but_slope_correct_after_try(nCounter));
        nCounter++;
      }
      this.specialSteps.push(this.attempts_over());
      return this.specialSteps.push(this.confirm_correct());
    };

    return LineConstructionSequence;

  })();

}).call(this);
