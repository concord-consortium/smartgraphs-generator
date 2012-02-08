(function() {
  var AuthorPane, ConstructedResponseSequence, CorrectableSequenceWithFeedback, InstructionSequence, NoSequence, NumericSequence, PickAPointSequence, Sequence,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AuthorPane = require('./author-panes').AuthorPane;

  Sequence = exports.Sequence = {
    classFor: {},
    fromHash: function(hash) {
      var SequenceClass, _ref;
      SequenceClass = this.classFor[(_ref = hash.type) != null ? _ref : 'NoSequence'];
      if (!(SequenceClass != null)) {
        throw new Error("Sequence type " + hash.type + " is not supported");
      }
      return new SequenceClass(hash);
    }
  };

  Sequence.classFor['NoSequence'] = NoSequence = (function() {

    function NoSequence(_arg) {
      var i, pane, _len, _ref;
      this.page = _arg.page;
      this.predictionPanes = [];
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredictionGraphPane']) {
          this.predictionPanes.push(pane);
        }
      }
    }

    NoSequence.prototype.appendSteps = function(runtimePage) {
      var i, isActiveInputPane, n, numSteps, pane, previousAnnotation, step, steps, _len, _ref;
      steps = [];
      numSteps = this.predictionPanes.length || 1;
      for (n = 0; 0 <= numSteps ? n < numSteps : n > numSteps; 0 <= numSteps ? n++ : n--) {
        step = runtimePage.appendStep();
        if (n !== 0) steps[n - 1].setDefaultBranch(step);
        _ref = this.page.panes;
        for (i = 0, _len = _ref.length; i < _len; i++) {
          pane = _ref[i];
          isActiveInputPane = (i === n) || (this.predictionPanes.length === 1);
          previousAnnotation = !isActiveInputPane && i === 0 ? this.page.panes[0].annotation : void 0;
          pane.addToStep(step, {
            isActiveInputPane: isActiveInputPane,
            previousAnnotation: previousAnnotation
          });
        }
        if (this.predictionPanes[n] != null) {
          step.setSubmissibilityCriterion([">=", ["sketchLength", this.predictionPanes[n].annotation.name], 0.2]);
          step.setSubmissibilityDependsOn(["annotation", this.predictionPanes[n].annotation.name]);
        }
        steps.push(step);
      }
      return steps;
    };

    return NoSequence;

  })();

  Sequence.classFor['InstructionSequence'] = InstructionSequence = (function(_super) {

    __extends(InstructionSequence, _super);

    function InstructionSequence(_arg) {
      this.text = _arg.text, this.page = _arg.page;
      InstructionSequence.__super__.constructor.apply(this, arguments);
    }

    InstructionSequence.prototype.appendSteps = function(runtimePage) {
      var step, steps, _i, _len, _results;
      steps = InstructionSequence.__super__.appendSteps.apply(this, arguments);
      _results = [];
      for (_i = 0, _len = steps.length; _i < _len; _i++) {
        step = steps[_i];
        _results.push(step.setBeforeText(this.text));
      }
      return _results;
    };

    return InstructionSequence;

  })(NoSequence);

  Sequence.classFor['ConstructedResponseSequence'] = ConstructedResponseSequence = (function() {

    function ConstructedResponseSequence(_arg) {
      this.initialPrompt = _arg.initialPrompt, this.initialContent = _arg.initialContent, this.page = _arg.page;
    }

    ConstructedResponseSequence.prototype.appendSteps = function(runtimePage) {
      var pane, responseTemplate, runtimeActivity, step, _i, _len, _ref, _results;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("ConstructedResponseTemplate", [this.initialContent]);
      step = runtimePage.appendStep();
      step.setBeforeText(this.initialPrompt);
      step.setSubmissibilityCriterion(["textLengthIsAtLeast", 1, ["responseField", 1]]);
      step.setResponseTemplate(responseTemplate);
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };

    return ConstructedResponseSequence;

  })();

  CorrectableSequenceWithFeedback = (function() {

    CorrectableSequenceWithFeedback.prototype.HIGHLIGHT_COLOR = '#1f77b4';

    function CorrectableSequenceWithFeedback(_arg) {
      var i, pane, _len, _ref;
      this.initialPrompt = _arg.initialPrompt, this.correctAnswer = _arg.correctAnswer, this.correctAnswerPoint = _arg.correctAnswerPoint, this.correctAnswerRange = _arg.correctAnswerRange, this.hints = _arg.hints, this.giveUp = _arg.giveUp, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page;
      if (typeof this.initialPrompt === 'string') {
        this.initialPrompt = {
          text: this.initialPrompt
        };
      }
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

    CorrectableSequenceWithFeedback.prototype.getRequiresGraphOrTable = function() {
      return this.getHasVisualPrompts() || this.getNeedsGraphData();
    };

    CorrectableSequenceWithFeedback.prototype.getNeedsGraphData = function() {
      return false;
    };

    CorrectableSequenceWithFeedback.prototype.getHasVisualPrompts = function() {
      var feedback, _i, _len, _ref, _ref2;
      _ref = this.hints.concat(this.initialPrompt, this.giveUp, this.confirmCorrect);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        feedback = _ref[_i];
        if (((_ref2 = feedback.visualPrompts) != null ? _ref2.length : void 0) > 0) {
          return true;
        }
      }
      return false;
    };

    CorrectableSequenceWithFeedback.prototype.getCriterion = function() {
      return [];
    };

    CorrectableSequenceWithFeedback.prototype.getDataDefRef = function(runtimeActivity) {
      if (this.graphPane == null) return null;
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };

    CorrectableSequenceWithFeedback.prototype.appendStepsWithModifier = function(runtimePage, modifyForSequenceType) {
      var addPanesAndFeedbackToStep, answerableInfo, answerableSteps, confirmCorrectStep, giveUpStep, index, lastAnswerableStep, runtimeActivity, step, steps, _i, _len, _len2, _ref, _results,
        _this = this;
      if (this.getRequiresGraphOrTable() && !(this.graphPane != null) && !(this.tablePane != null)) {
        throw new Error("Sequence requires at least one graph or table pane");
      }
      runtimeActivity = runtimePage.activity;
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      steps = [];
      answerableSteps = [];
      addPanesAndFeedbackToStep = function(_arg) {
        var from, pane, prompt, promptHash, step, _i, _j, _len, _len2, _ref, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
        step = _arg.step, from = _arg.from;
        _ref = _this.page.panes;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          pane = _ref[_i];
          pane.addToStep(step);
        }
        step.setBeforeText(from.text);
        _ref3 = (_ref2 = from.visualPrompts) != null ? _ref2 : [];
        _results = [];
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          prompt = _ref3[_j];
          promptHash = {
            type: prompt.type,
            datadefRef: _this.datadefRef,
            color: prompt.color,
            x: (_ref4 = (_ref5 = prompt.point) != null ? _ref5[0] : void 0) != null ? _ref4 : void 0,
            y: (_ref6 = (_ref7 = prompt.point) != null ? _ref7[1] : void 0) != null ? _ref6 : void 0,
            xMin: (_ref8 = prompt.xMin) != null ? _ref8 : -Infinity,
            xMax: (_ref9 = prompt.xMax) != null ? _ref9 : Infinity,
            axis: (_ref10 = prompt.axis) != null ? _ref10.replace("_axis", "") : void 0
          };
          _results.push(step.addAnnotationToPane({
            annotation: runtimeActivity.createAndAppendAnnotation(promptHash),
            index: _this.graphPane.index
          }));
        }
        return _results;
      };
      _ref = (this.hints ? [this.initialPrompt].concat(this.hints) : [this.initialPrompt]);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        answerableInfo = _ref[_i];
        steps.push(step = runtimePage.appendStep());
        answerableSteps.push(step);
        addPanesAndFeedbackToStep({
          step: step,
          from: answerableInfo
        });
      }
      steps.push(giveUpStep = runtimePage.appendStep());
      addPanesAndFeedbackToStep({
        step: giveUpStep,
        from: this.giveUp
      });
      steps.push(confirmCorrectStep = runtimePage.appendStep());
      addPanesAndFeedbackToStep({
        step: confirmCorrectStep,
        from: this.confirmCorrect
      });
      lastAnswerableStep = answerableSteps[answerableSteps.length - 1];
      _results = [];
      for (index = 0, _len2 = answerableSteps.length; index < _len2; index++) {
        step = answerableSteps[index];
        modifyForSequenceType(step);
        step.setSubmitButtonTitle("Check My Answer");
        step.appendResponseBranch({
          criterion: this.getCriterion(),
          step: confirmCorrectStep
        });
        if (step === lastAnswerableStep) {
          _results.push(step.setDefaultBranch(giveUpStep));
        } else {
          _results.push(step.setDefaultBranch(answerableSteps[index + 1]));
        }
      }
      return _results;
    };

    return CorrectableSequenceWithFeedback;

  })();

  Sequence.classFor['PickAPointSequence'] = PickAPointSequence = (function(_super) {

    __extends(PickAPointSequence, _super);

    function PickAPointSequence() {
      PickAPointSequence.__super__.constructor.apply(this, arguments);
    }

    PickAPointSequence.prototype.getRequiresGraphOrTable = function() {
      return true;
    };

    PickAPointSequence.prototype.getCriterion = function() {
      if (this.correctAnswerPoint != null) {
        return ["coordinates=", this.tag.name, this.correctAnswerPoint[0], this.correctAnswerPoint[1]];
      }
      return ["coordinatesInRange", this.tag.name, this.correctAnswerRange.xMin, this.correctAnswerRange.yMin, this.correctAnswerRange.xMax, this.correctAnswerRange.yMax];
    };

    PickAPointSequence.prototype.appendSteps = function(runtimePage) {
      var datadefRef, modifierForSequenceType, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tag = runtimeActivity.createAndAppendTag();
      this.highlightedPoint = runtimeActivity.createAndAppendAnnotation({
        type: "HighlightedPoint",
        datadefRef: datadefRef,
        tag: this.tag,
        color: this.HIGHLIGHT_COLOR
      });
      modifierForSequenceType = function(step) {
        step.addTaggingTool({
          tag: _this.tag,
          datadefRef: _this.datadefRef
        });
        if (_this.graphPane != null) {
          step.addAnnotationToPane({
            annotation: _this.highlightedPoint,
            index: _this.graphPane.index
          });
        }
        if (_this.tablePane != null) {
          return step.addAnnotationToPane({
            annotation: _this.highlightedPoint,
            index: _this.tablePane.index
          });
        }
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return PickAPointSequence;

  })(CorrectableSequenceWithFeedback);

  Sequence.classFor['NumericSequence'] = NumericSequence = (function(_super) {

    __extends(NumericSequence, _super);

    function NumericSequence() {
      NumericSequence.__super__.constructor.apply(this, arguments);
    }

    NumericSequence.prototype.getCriterion = function() {
      return ["=", ["responseField", 1], this.correctAnswer];
    };

    NumericSequence.prototype.appendSteps = function(runtimePage) {
      var modifierForSequenceType, responseTemplate, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("NumericResponseTemplate");
      modifierForSequenceType = function(step) {
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        return step.setResponseTemplate(responseTemplate);
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return NumericSequence;

  })(CorrectableSequenceWithFeedback);

}).call(this);
