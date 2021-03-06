(function() {
  var AuthorPane, LabelSequence;

  AuthorPane = require('./author-panes').AuthorPane;

  exports.LabelSequence = LabelSequence = (function() {

    function LabelSequence(_arg) {
      var i, pane, _len, _ref;
      this.type = _arg.type, this.text = _arg.text, this.labelSetName = _arg.labelSetName, this.numberOfLabels = _arg.numberOfLabels, this.dataset = _arg.dataset, this.page = _arg.page;
      if (!this.numberOfLabels) this.numberOfLabels = 1;
      this.anyLabel = this.dataset ? true : false;
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
    }

    LabelSequence.prototype.appendSteps = function(runtimePage) {
      var datadefRef, pane, runtimeActivity, step, _i, _len, _ref;
      runtimeActivity = runtimePage.activity;
      step = runtimePage.appendStep();
      step.setBeforeText(this.text);
      step.setSubmissibilityCriterion(["=", ["numberOfLabels", this.labelSetName], this.numberOfLabels], step.setSubmissibilityDependsOn(["annotation", this.labelSetName]));
      _ref = this.page.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToStep(step);
      }
      if (this.dataset) {
        datadefRef = runtimeActivity.getDatadefRef(this.dataset);
        step.addLabelTool({
          labelSetName: this.labelSetName,
          index: this.graphPane.index,
          datadefRef: datadefRef,
          markOnDataPoints: true,
          maxNoOfLabels: this.numberOfLabels,
          allowCoordinatesChange: false
        });
      } else {
        step.addLabelTool({
          labelSetName: this.labelSetName,
          index: this.graphPane.index,
          markOnDataPoints: false,
          maxNoOfLabels: this.numberOfLabels,
          allowCoordinatesChange: true
        });
      }
      if (this.labelSetName) {
        this.labelSetObject = runtimeActivity.createAndAppendAnnotation({
          type: 'LabelSet',
          name: this.labelSetName
        });
        return step.addAnnotationToPane({
          annotation: this.labelSetObject,
          index: this.graphPane.index
        });
      }
    };

    return LabelSequence;

  })();

}).call(this);
