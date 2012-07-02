(function() {
  var AuthorPane, LineConstructionSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LineConstructionSequence = LineConstructionSequence = (function() {

    LineConstructionSequence.prototype.require_numeric_input = function(dest) {
      return ["isNumeric", ["responseField", 0]];
    };

    LineConstructionSequence.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };

    LineConstructionSequence.prototype.setupStep = function(_arg) {
      var runtimePage, step, stepdef;
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
      return step.defaultBranch = this.runtimeStepsByName[stepdef.defaultBranch];
    };

    function LineConstructionSequence(_arg) {
      var i, pane, _len, _ref;
      this.slope = _arg.slope, this.slopeTolerance = _arg.slopeTolerance, this.yIntercept = _arg.yIntercept, this.yInterceptTolerance = _arg.yInterceptTolerance, this.initialPrompt = _arg.initialPrompt, this.confirmCorrect = _arg.confirmCorrect, this.slopeIncorrect = _arg.slopeIncorrect, this.yInterceptIncorrect = _arg.yInterceptIncorrect, this.allIncorrect = _arg.allIncorrect, this.showCrossHairs = _arg.showCrossHairs, this.showToolTipCoords = _arg.showToolTipCoords, this.showGraphGrid = _arg.showGraphGrid, this.page = _arg.page;
      this.steps = [];
      this.runtimeStepsByName = {};
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

    LineConstructionSequence.prototype.appendSteps = function(runtimePage) {
      var datadefRef, isActiveInputPane, previousAnnotation, runtimeActivity, runtimeStep, stepdef, _i, _j, _len, _len2, _ref, _ref2, _results;
      this.annotations = {};
      this.yAxis = this.graphPane.yAxis;
      this.xAxis = this.graphPane.xAxis;
      this.x_axis_name = this.xAxis.label.toLowerCase();
      this.y_axis_name = this.yAxis.label.toLowerCase();
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.assemble_steps();
      _ref = this.steps;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stepdef = _ref[_i];
        runtimeStep = runtimePage.appendStep();
        isActiveInputPane = true;
        previousAnnotation = this.graphPane.annotation;
        this.graphPane.addToStep(runtimeStep, {
          isActiveInputPane: isActiveInputPane,
          previousAnnotation: previousAnnotation
        });
        this.runtimeStepsByName[stepdef.name] = runtimeStep;
      }
      _ref2 = this.steps;
      _results = [];
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        stepdef = _ref2[_j];
        _results.push(this.setupStep({
          stepdef: stepdef,
          runtimePage: runtimePage
        }));
      }
      return _results;
    };

    LineConstructionSequence.prototype.first_question = function() {
      return {
        name: "question_1",
        defaultBranch: "when_line_appears",
        submitButtonTitle: "Check My Answer",
        beforeText: this.initialPrompt,
        substitutedExpressions: [],
        submissibilityCriterion: this.require_numeric_input(),
        graphAnnotations: [],
        tableAnnotations: [],
        tools: []
      };
    };

    LineConstructionSequence.prototype.assemble_steps = function() {
      return this.steps.push(this.first_question());
    };

    return LineConstructionSequence;

  })();

}).call(this);
