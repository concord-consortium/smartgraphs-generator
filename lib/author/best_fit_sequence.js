(function() {
  var AuthorPane, BestFitSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.BestFitSequence = BestFitSequence = (function() {

    function BestFitSequence(_arg) {
      var i, pane, _len, _ref;
      this.type = _arg.type, this.dataSetName = _arg.dataSetName, this.learnerDataSet = _arg.learnerDataSet, this.correctTolerance = _arg.correctTolerance, this.closeTolerance = _arg.closeTolerance, this.initialPrompt = _arg.initialPrompt, this.incorrectPrompt = _arg.incorrectPrompt, this.closePrompt = _arg.closePrompt, this.confirmCorrect = _arg.confirmCorrect, this.maxAttempts = _arg.maxAttempts, this.page = _arg.page;
      if (this.maxAttempts === 0) {
        throw new Error("Number of attempts should be more than 0");
      }
      this.bestFitLineslope = 0;
      this.bestFitLineConstant = 0;
      this.SumofSquares = 0;
      this.bestFitLineDataDef;
      this.bestFitLineDataRef;
      this.bestFitLineColor;
      this.learnerDataSetColor = '#cc0000';
      this.steps = [];
      this.specialSteps = [];
      this.runtimeStepsByName = {};
      this.correctLineDataSetName = "CorrectLine-" + this.page.index;
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
      if (this.learnerDataSet) {
        this.graphPane.activeDatasetName = this.learnerDataSet;
      }
      if (!this.maxAttempts) this.maxAttempts = 1;
    }

    BestFitSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
    };

    BestFitSequence.prototype.setupStep = function(_arg) {
      var annotation, dataDefRefForStep, hasAnswer, legendsDataset, response_def, runtimePage, step, stepDataDefRef, stepDataRefs, stepIncludedDataSets, stepdef, tool, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
      runtimePage = _arg.runtimePage, stepdef = _arg.stepdef, hasAnswer = _arg.hasAnswer;
      dataDefRefForStep = this.graphPane.datadefRef;
      step = this.runtimeStepsByName[stepdef.name];
      stepDataDefRef = [];
      stepIncludedDataSets = [];
      stepDataRefs = [];
      legendsDataset = [this.learnerDataSet];
      if (hasAnswer === "true") {
        stepDataRefs = this.graphPane.dataRef.concat(this.bestFitLineDataRef);
        stepDataDefRef = dataDefRefForStep.concat({
          key: this.correctLineDataSetName,
          datadef: this.bestFitLineDataDef
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
        dataRef: stepDataRefs,
        sequenceType: {
          title: "Sum of squares",
          type: "AvgSumOfDeviation",
          referenceDatadef: this.dataSetName,
          legendDataSets: legendsDataset
        }
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

    BestFitSequence.prototype.check_correct_answer = function(nCounter) {
      var closeTolerance, correctTolerance, criterianArray, nextCloseCorrect;
      criterianArray = [];
      correctTolerance = this.SumofSquares * this.correctTolerance / 100;
      closeTolerance = this.SumofSquares * this.closeTolerance / 100;
      if ((nCounter + 1) < this.maxAttempts) {
        nextCloseCorrect = 'close_answer_after_' + (nCounter + 1) + '_try';
        criterianArray = [
          {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
            "step": 'correct_answer'
          }, {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], closeTolerance],
            "step": nextCloseCorrect
          }
        ];
      } else {
        criterianArray = [
          {
            "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
            "step": 'correct_answer'
          }
        ];
      }
      return criterianArray;
    };

    BestFitSequence.prototype.check_final_answer = function() {
      return [
        {
          "criterion": ["withinAbsTolerance", this.SumofSquares, ["deviationValue", this.learnerDataSet], correctTolerance],
          "step": 'correct_answer'
        }
      ];
    };

    BestFitSequence.prototype.get_bestFitLine = function(runtimeActivity, graphPane) {
      var NewEmptyData, bestFitLineExpression, dataPointSet, dataSet, ditanceOfPointFromBestFitLine, i, j, negated_sign_char, numPoints, point, productOfXDiffYDiff, scaleFactor, squareOfXDifference, sumOfX, sumOfY, xDifference, xMean, yDifference, yMean;
      dataPointSet = runtimeActivity.getDatadefRef("" + this.dataSetName);
      dataSet = dataPointSet.datadef.points;
      if (!(dataSet.length && dataSet.length > 5)) {
        throw new Error("Not valid Dataset !!!!");
      }
      this.bestFitLineslope = 0;
      this.bestFitLineConstant = 0;
      sumOfX = 0;
      sumOfY = 0;
      numPoints = dataSet.length;
      xDifference = 0;
      yDifference = 0;
      xMean = 0;
      yMean = 0;
      squareOfXDifference = 0;
      i = 0;
      scaleFactor = 10000;
      while (i < numPoints) {
        point = dataSet[i];
        sumOfX += point[0] * scaleFactor;
        sumOfY += point[1] * scaleFactor;
        i++;
      }
      xMean = sumOfX / numPoints;
      yMean = sumOfY / numPoints;
      i = 0;
      productOfXDiffYDiff = 0;
      while (i < numPoints) {
        point = dataSet[i];
        xDifference = (point[0] * scaleFactor) - xMean;
        yDifference = (point[1] * scaleFactor) - yMean;
        productOfXDiffYDiff += xDifference * yDifference;
        squareOfXDifference += xDifference * xDifference;
        i++;
      }
      this.bestFitLineslope = productOfXDiffYDiff / squareOfXDifference;
      if (this.bestFitLineslope === Infinity || this.bestFitLineslope === -Infinity || isNaN(this.bestFitLineslope)) {
        throw new Error("Invalid scatter-plot");
      }
      this.bestFitLineConstant = (yMean - (this.bestFitLineslope * xMean)) / scaleFactor;
      this.SumofSquares = 0;
      j = 0;
      while (j < numPoints) {
        point = dataSet[j];
        ditanceOfPointFromBestFitLine = Math.abs((this.bestFitLineslope * point[0]) - point[1] + this.bestFitLineConstant);
        this.SumofSquares += ditanceOfPointFromBestFitLine * ditanceOfPointFromBestFitLine;
        j++;
      }
      negated_sign_char = this.bestFitLineConstant >= 0 ? '+' : '-';
      bestFitLineExpression = 'y = ' + this.bestFitLineslope + 'x' + negated_sign_char + Math.abs(this.bestFitLineConstant);
      this.bestFitLineColor = runtimeActivity.getNewColor();
      NewEmptyData = runtimeActivity.createNewEmptyDataRef(this.correctLineDataSetName, bestFitLineExpression, 0.1, 0, this.bestFitLineColor);
      this.bestFitLineDataDef = NewEmptyData.dataDef;
      this.bestFitLineDataRef = NewEmptyData.dataRef;
      runtimeActivity.setColorOfDatadef(this.dataSetName, this.bestFitLineColor);
      runtimeActivity.setColorOfDatadef(this.learnerDataSet, this.learnerDataSetColor);
      return this.bestFitLineDataDef;
    };

    BestFitSequence.prototype.appendSteps = function(runtimePage) {
      var annotation, otherAnnotations, runtimeActivity, runtimeStep, stepdef, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _m, _ref, _ref2, _ref3, _ref4, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      this.get_bestFitLine(runtimeActivity, this.graphPane);
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

    BestFitSequence.prototype.first_question = function() {
      return {
        name: "first_question",
        defaultBranch: this.maxAttempts === 1 ? "attempts_over" : "incorrect_answer_after_1_try",
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

    BestFitSequence.prototype.incorrect_answer_after_try = function(nCounter) {
      return {
        name: "incorrect_answer_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.incorrectPrompt + "</b><p>" + this.initialPrompt + "</p>",
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

    BestFitSequence.prototype.close_answer_after_try = function(nCounter) {
      return {
        name: "close_answer_after_" + nCounter + "_try",
        defaultBranch: (nCounter + 1) < this.maxAttempts ? "incorrect_answer_after_" + (nCounter + 1) + "_try" : "attempts_over",
        submitButtonTitle: "Check My Answer",
        beforeText: "<b>" + this.closePrompt + "</b><p>" + this.initialPrompt + "</p>",
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

    BestFitSequence.prototype.attempts_over = function() {
      return {
        name: "attempts_over",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>Your estimate is incorrect.</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    BestFitSequence.prototype.correct_answer = function() {
      return {
        name: "correct_answer",
        isFinalStep: true,
        hideSubmitButton: true,
        beforeText: "<b>" + this.confirmCorrect + "</b>",
        showCrossHairs: false,
        showToolTipCoords: false,
        showGraphGrid: this.graphPane.showGraphGrid,
        graphAnnotations: ["singleLineGraphing"]
      };
    };

    BestFitSequence.prototype.assemble_steps = function() {
      var nCounter;
      nCounter = 1;
      this.steps.push(this.first_question());
      while (nCounter < this.maxAttempts) {
        this.steps.push(this.incorrect_answer_after_try(nCounter));
        this.steps.push(this.close_answer_after_try(nCounter));
        nCounter++;
      }
      this.specialSteps.push(this.attempts_over());
      return this.specialSteps.push(this.correct_answer());
    };

    return BestFitSequence;

  })();

}).call(this);
