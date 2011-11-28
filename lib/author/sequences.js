(function() {
  var AuthorPane, ConstructedResponseSequence, CorrectableSequenceWithFeedback, InstructionSequence, NoSequence, NumericSequence, PickAPointSequence, Sequence;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
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
      _ref = this.page.panes || [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        pane = _ref[i];
        if (pane instanceof AuthorPane.classFor['PredictionGraphPane']) {
          this.predictionPane = pane;
        }
      }
    }
    NoSequence.prototype.appendSteps = function(runtimePage) {
      var pane, step, _i, _len, _ref;
      step = runtimePage.appendStep();
      _ref = this.page.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToStep(step);
      }
      if (this.predictionPane != null) {
        step.setSubmissibilityCriterion([">=", ["sketchLength", this.predictionPane.annotation.name], 0.2]);
        step.setSubmissibilityDependsOn(["annotation", this.predictionPane.annotation.name]);
      }
      return step;
    };
    return NoSequence;
  })();
  Sequence.classFor['InstructionSequence'] = InstructionSequence = (function() {
    __extends(InstructionSequence, NoSequence);
    function InstructionSequence(_arg) {
      this.text = _arg.text, this.page = _arg.page;
      InstructionSequence.__super__.constructor.apply(this, arguments);
    }
    InstructionSequence.prototype.appendSteps = function(runtimePage) {
      var step;
      step = InstructionSequence.__super__.appendSteps.apply(this, arguments);
      return step.setBeforeText(this.text);
    };
    return InstructionSequence;
  })();
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
      if (this.graphPane == null) {
        return null;
      }
      return runtimeActivity.getDatadefRef("" + this.page.index + "-" + this.graphPane.index);
    };
    CorrectableSequenceWithFeedback.prototype.appendStepsWithModifier = function(runtimePage, modifyForSequenceType) {
      var addPanesAndFeedbackToStep, answerableInfo, answerableSteps, confirmCorrectStep, giveUpStep, index, lastAnswerableStep, runtimeActivity, step, steps, _i, _len, _len2, _ref, _results;
      if (this.getRequiresGraphOrTable() && !(this.graphPane != null) && !(this.tablePane != null)) {
        throw new Error("Sequence requires at least one graph or table pane");
      }
      runtimeActivity = runtimePage.activity;
      this.datadefRef = this.getDataDefRef(runtimeActivity);
      steps = [];
      answerableSteps = [];
      addPanesAndFeedbackToStep = __bind(function(_arg) {
        var from, pane, prompt, promptHash, step, _i, _j, _len, _len2, _ref, _ref10, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
        step = _arg.step, from = _arg.from;
        _ref = this.page.panes;
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
            datadefRef: this.datadefRef,
            color: prompt.color,
            x: (_ref4 = (_ref5 = prompt.point) != null ? _ref5[0] : void 0) != null ? _ref4 : void 0,
            y: (_ref6 = (_ref7 = prompt.point) != null ? _ref7[1] : void 0) != null ? _ref6 : void 0,
            xMin: (_ref8 = prompt.xMin) != null ? _ref8 : -Infinity,
            xMax: (_ref9 = prompt.xMax) != null ? _ref9 : Infinity,
            axis: (_ref10 = prompt.axis) != null ? _ref10.replace("_axis", "") : void 0
          };
          _results.push(step.addAnnotationToPane({
            annotation: runtimeActivity.createAndAppendAnnotation(promptHash),
            index: this.graphPane.index
          }));
        }
        return _results;
      }, this);
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
        _results.push(step === lastAnswerableStep ? step.setDefaultBranch(giveUpStep) : step.setDefaultBranch(answerableSteps[index + 1]));
      }
      return _results;
    };
    return CorrectableSequenceWithFeedback;
  })();
  Sequence.classFor['PickAPointSequence'] = PickAPointSequence = (function() {
    __extends(PickAPointSequence, CorrectableSequenceWithFeedback);
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
      var datadefRef, modifierForSequenceType, runtimeActivity;
      runtimeActivity = runtimePage.activity;
      datadefRef = this.getDataDefRef(runtimeActivity);
      this.tag = runtimeActivity.createAndAppendTag();
      this.highlightedPoint = runtimeActivity.createAndAppendAnnotation({
        type: "HighlightedPoint",
        datadefRef: datadefRef,
        tag: this.tag,
        color: this.HIGHLIGHT_COLOR
      });
      modifierForSequenceType = __bind(function(step) {
        step.addTaggingTool({
          tag: this.tag,
          datadefRef: this.datadefRef
        });
        if (this.graphPane != null) {
          step.addAnnotationToPane({
            annotation: this.highlightedPoint,
            index: this.graphPane.index
          });
        }
        if (this.tablePane != null) {
          return step.addAnnotationToPane({
            annotation: this.highlightedPoint,
            index: this.tablePane.index
          });
        }
      }, this);
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };
    return PickAPointSequence;
  })();
  Sequence.classFor['NumericSequence'] = NumericSequence = (function() {
    __extends(NumericSequence, CorrectableSequenceWithFeedback);
    function NumericSequence() {
      NumericSequence.__super__.constructor.apply(this, arguments);
    }
    NumericSequence.prototype.getCriterion = function() {
      return ["=", ["responseField", 1], this.correctAnswer];
    };
    NumericSequence.prototype.appendSteps = function(runtimePage) {
      var modifierForSequenceType, responseTemplate, runtimeActivity;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("NumericResponseTemplate");
      modifierForSequenceType = __bind(function(step) {
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        return step.setResponseTemplate(responseTemplate);
      }, this);
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };
    return NumericSequence;
  })();
}).call(this);
