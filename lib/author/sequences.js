(function() {
  var AuthorPane, BestFitSequence, ConstructedResponseSequence, CorrectableSequenceWithFeedback, InstructionSequence, LineConstructionSequence, MultipleChoiceWithCustomHintsSequence, MultipleChoiceWithSequentialHintsSequence, NoSequence, NumericSequence, PickAPointSequence, Sequence, SlopeToolSequence, asObject,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  AuthorPane = require('./author-panes').AuthorPane;

  SlopeToolSequence = require('./slope_tool_sequence').SlopeToolSequence;

  LineConstructionSequence = require('./line_construction_sequence').LineConstructionSequence;

  BestFitSequence = require('./best_fit_sequence').BestFitSequence;

  asObject = function(s) {
    if (typeof s === 'string') {
      return {
        text: s
      };
    } else {
      return s;
    }
  };

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
      var annotation, i, isActiveInputPane, label, labelObject, labelSetName, labelsArray, n, numSteps, pane, previousAnnotation, runtimeActivity, runtimeLabelSet, step, steps, _i, _j, _k, _len, _len2, _len3, _len4, _len5, _ref, _ref2, _ref3, _ref4, _ref5;
      steps = [];
      numSteps = this.predictionPanes.length || 1;
      runtimeActivity = runtimePage.activity;
      this.annotations = [];
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
      _ref2 = this.page.panes || [];
      for (i = 0, _len2 = _ref2.length; i < _len2; i++) {
        pane = _ref2[i];
        if (pane.labelSets) {
          _ref3 = pane.labelSets;
          for (_i = 0, _len3 = _ref3.length; _i < _len3; _i++) {
            labelSetName = _ref3[_i];
            _ref4 = runtimeActivity.labelSets;
            for (_j = 0, _len4 = _ref4.length; _j < _len4; _j++) {
              runtimeLabelSet = _ref4[_j];
              if (runtimeLabelSet.name === labelSetName) {
                labelsArray = [];
                _ref5 = runtimeLabelSet.labels;
                for (_k = 0, _len5 = _ref5.length; _k < _len5; _k++) {
                  label = _ref5[_k];
                  label.type = 'Label';
                  label.namePrefix = labelSetName;
                  labelObject = runtimeActivity.createAndAppendAnnotation(label);
                  labelsArray.push(labelObject.getUrl());
                }
                annotation = runtimeActivity.createAndAppendAnnotation({
                  name: labelSetName,
                  labels: labelsArray,
                  type: 'LabelSet'
                });
                step.addAnnotationToPane({
                  annotation: annotation,
                  index: i
                });
              }
            }
          }
        }
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
      this.initialPrompt = asObject(this.initialPrompt);
    }

    ConstructedResponseSequence.prototype.appendSteps = function(runtimePage) {
      var pane, responseTemplate, runtimeActivity, step, _i, _len, _ref, _results;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate("ConstructedResponseTemplate", [this.initialContent]);
      step = runtimePage.appendStep();
      step.setBeforeText(this.initialPrompt.text);
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

  Sequence.classFor['MultipleChoiceWithCustomHintsSequence'] = MultipleChoiceWithCustomHintsSequence = (function() {

    function MultipleChoiceWithCustomHintsSequence(_arg) {
      var hint, indexed, _i, _len, _ref, _ref2;
      this.initialPrompt = _arg.initialPrompt, this.choices = _arg.choices, this.correctAnswerIndex = _arg.correctAnswerIndex, this.hints = _arg.hints, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page;
      _ref = [this.initialPrompt, this.confirmCorrect].map(asObject), this.initialPrompt = _ref[0], this.confirmCorrect = _ref[1];
      indexed = [];
      _ref2 = this.hints;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        hint = _ref2[_i];
        indexed[hint.choiceIndex] = hint;
      }
      this.orderedHints = (function() {
        var _j, _len2, _results;
        _results = [];
        for (_j = 0, _len2 = indexed.length; _j < _len2; _j++) {
          hint = indexed[_j];
          if (hint != null) _results.push(hint);
        }
        return _results;
      })();
    }

    MultipleChoiceWithCustomHintsSequence.prototype.getCriterionForChoice = function(choiceIndex) {
      return ["=", ["responseField", 1], 1 + choiceIndex];
    };

    MultipleChoiceWithCustomHintsSequence.prototype.appendSteps = function(runtimePage) {
      var answerableSteps, confirmCorrectStep, hint, hintStepsByChoiceIndex, index, pane, responseTemplate, runtimeActivity, step, stepInfo, steps, _i, _j, _k, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _results;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate('MultipleChoiceTemplate', [''], this.choices);
      steps = [];
      answerableSteps = [];
      hintStepsByChoiceIndex = [];
      _ref = [this.initialPrompt].concat(this.orderedHints).concat([this.confirmCorrect]);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stepInfo = _ref[_i];
        step = runtimePage.appendStep();
        steps.push(step);
        if (stepInfo !== this.confirmCorrect) answerableSteps.push(step);
        if (!(stepInfo === this.initialPrompt || stepInfo === this.confirmCorrect)) {
          hintStepsByChoiceIndex[stepInfo.choiceIndex] = step;
        }
        if (stepInfo === this.confirmCorrect) confirmCorrectStep = step;
        _ref2 = this.page.panes;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          pane = _ref2[_j];
          pane.addToStep(step);
        }
        step.setBeforeText(stepInfo.text);
      }
      _results = [];
      for (index = 0, _len3 = answerableSteps.length; index < _len3; index++) {
        step = answerableSteps[index];
        step.setSubmitButtonTitle("Check My Answer");
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        step.setResponseTemplate(responseTemplate);
        step.appendResponseBranch({
          criterion: this.getCriterionForChoice(this.correctAnswerIndex),
          step: confirmCorrectStep
        });
        _ref3 = this.orderedHints;
        for (_k = 0, _len4 = _ref3.length; _k < _len4; _k++) {
          hint = _ref3[_k];
          step.appendResponseBranch({
            criterion: this.getCriterionForChoice(hint.choiceIndex),
            step: hintStepsByChoiceIndex[hint.choiceIndex]
          });
        }
        _results.push(step.setDefaultBranch(step));
      }
      return _results;
    };

    return MultipleChoiceWithCustomHintsSequence;

  })();

  CorrectableSequenceWithFeedback = (function() {

    CorrectableSequenceWithFeedback.prototype.HIGHLIGHT_COLOR = '#1f77b4';

    function CorrectableSequenceWithFeedback(_arg) {
      var i, pane, _len, _ref, _ref2;
      this.initialPrompt = _arg.initialPrompt, this.hints = _arg.hints, this.giveUp = _arg.giveUp, this.confirmCorrect = _arg.confirmCorrect, this.page = _arg.page, this.dataSetName = _arg.dataSetName;
      _ref = [this.initialPrompt, this.giveUp, this.confirmCorrect].map(asObject), this.initialPrompt = _ref[0], this.giveUp = _ref[1], this.confirmCorrect = _ref[2];
      _ref2 = this.page.panes || [];
      for (i = 0, _len = _ref2.length; i < _len; i++) {
        pane = _ref2[i];
        if (pane instanceof AuthorPane.classFor['PredefinedGraphPane']) {
          this.graphPane = pane;
        }
        if (pane instanceof AuthorPane.classFor['TablePane']) {
          this.tablePane = pane;
        }
      }
      if (this.dataSetName) this.graphPane.activeDatasetName = this.dataSetName;
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
      return runtimeActivity.getDatadefRef("" + this.graphPane.activeDatasetName);
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

    function PickAPointSequence(_arg) {
      this.correctAnswerPoint = _arg.correctAnswerPoint, this.correctAnswerRange = _arg.correctAnswerRange;
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

    function NumericSequence(_arg) {
      var _ref;
      this.correctAnswer = _arg.correctAnswer, this.tolerance = _arg.tolerance;
      this.tolerance = (_ref = this.tolerance) != null ? _ref : 0.01;
      NumericSequence.__super__.constructor.apply(this, arguments);
    }

    NumericSequence.prototype.getCriterion = function() {
      return ["withinAbsTolerance", ["responseField", 1], this.correctAnswer, this.tolerance];
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

  Sequence.classFor['MultipleChoiceWithSequentialHintsSequence'] = MultipleChoiceWithSequentialHintsSequence = (function(_super) {

    __extends(MultipleChoiceWithSequentialHintsSequence, _super);

    function MultipleChoiceWithSequentialHintsSequence(_arg) {
      this.correctAnswerIndex = _arg.correctAnswerIndex, this.choices = _arg.choices;
      MultipleChoiceWithSequentialHintsSequence.__super__.constructor.apply(this, arguments);
    }

    MultipleChoiceWithSequentialHintsSequence.prototype.getCriterion = function() {
      return ["=", ["responseField", 1], 1 + this.correctAnswerIndex];
    };

    MultipleChoiceWithSequentialHintsSequence.prototype.appendSteps = function(runtimePage) {
      var modifierForSequenceType, responseTemplate, runtimeActivity,
        _this = this;
      runtimeActivity = runtimePage.activity;
      responseTemplate = runtimeActivity.createAndAppendResponseTemplate('MultipleChoiceTemplate', [''], this.choices);
      modifierForSequenceType = function(step) {
        step.setSubmissibilityCriterion(["isNumeric", ["responseField", 1]]);
        return step.setResponseTemplate(responseTemplate);
      };
      return this.appendStepsWithModifier(runtimePage, modifierForSequenceType);
    };

    return MultipleChoiceWithSequentialHintsSequence;

  })(CorrectableSequenceWithFeedback);

  Sequence.classFor['SlopeToolSequence'] = SlopeToolSequence;

  Sequence.classFor['LineConstructionSequence'] = LineConstructionSequence;

  Sequence.classFor['BestFitSequence'] = BestFitSequence;

}).call(this);
