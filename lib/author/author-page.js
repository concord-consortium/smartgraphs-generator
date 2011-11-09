(function() {
  var AuthorPage, AuthorPane, ImagePane, InstructionSequence, NoSequence, PredefinedGraphPane, Sequence, TablePane, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorPage = AuthorPage = (function() {
    function AuthorPage(hash, activity, index) {
      var h, i, pane, _i, _len, _ref, _ref2, _ref3;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
      this.sequence = Sequence.fromHash(this.hash.sequence);
      this.sequence.page = this;
      if (((_ref2 = this.hash.panes) != null ? _ref2.length : void 0) > 2) {
        throw new Error("There cannot be more than two panes");
      }
      this.panes = this.hash.panes != null ? (function() {
        var _len, _ref3, _results;
        _ref3 = this.hash.panes;
        _results = [];
        for (i = 0, _len = _ref3.length; i < _len; i++) {
          h = _ref3[i];
          _results.push(AuthorPane.fromHash(h, i));
        }
        return _results;
      }).call(this) : [];
      _ref3 = this.panes;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        pane = _ref3[_i];
        pane.page = this;
      }
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var pane, runtimePage, _i, _len, _ref;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      _ref = this.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToPageAndActivity(runtimePage, runtimeActivity);
      }
      this.sequence.appendSteps(runtimePage);
      return runtimePage;
    };
    return AuthorPage;
  })();
  /*
    Sequence types
  */
  Sequence = {
    classFor: {},
    fromHash: function(hash) {
      var SequenceClass;
      SequenceClass = this.classFor[(hash != null ? hash.type : void 0) || 'NoSequence'];
      if (!(SequenceClass != null)) {
        throw new Error("Sequence type " + hash.type + " is not supported");
      }
      return new SequenceClass(hash);
    }
  };
  Sequence.classFor['NoSequence'] = NoSequence = (function() {
    function NoSequence() {}
    NoSequence.prototype.appendSteps = function(runtimePage) {
      var pane, step, _i, _len, _ref, _results;
      step = runtimePage.appendStep();
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };
    return NoSequence;
  })();
  Sequence.classFor['InstructionSequence'] = InstructionSequence = (function() {
    function InstructionSequence(_arg) {
      this.text = _arg.text;
    }
    InstructionSequence.prototype.appendSteps = function(runtimePage) {
      var pane, step, _i, _len, _ref, _results;
      step = runtimePage.appendStep();
      step.setBeforeText(this.text);
      _ref = this.page.panes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _results.push(pane.addToStep(step));
      }
      return _results;
    };
    return InstructionSequence;
  })();
  /*
    Pane types
  */
  AuthorPane = {
    classFor: {},
    fromHash: function(hash, index) {
      var PaneClass;
      PaneClass = this.classFor[hash.type];
      if (!(PaneClass != null)) {
        throw new Error("Pane type " + hash.type + " is not supported");
      }
      return new PaneClass(hash, index);
    }
  };
  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function() {
    function PredefinedGraphPane(_arg, index) {
      this.title = _arg.title, this.data = _arg.data, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks;
      this.index = index;
    }
    PredefinedGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var dataKey, datadef;
      if (this.xUnits) {
        this.xUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(this.xUnits));
      }
      if (this.yUnits) {
        this.yUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(this.yUnits));
      }
      this.xAxis = runtimeActivity.createAndAppendAxis({
        label: this.xLabel,
        unitRef: this.xUnitsRef,
        min: this.xMin,
        max: this.xMax,
        nSteps: this.xTicks
      });
      this.yAxis = runtimeActivity.createAndAppendAxis({
        label: this.yLabel,
        unitRef: this.yUnitsRef,
        min: this.yMin,
        max: this.yMax,
        nSteps: this.yTicks
      });
      if (this.data != null) {
        dataKey = "" + this.page.name + "-" + this.index;
        this.datadefRef = runtimeActivity.getDatadefRef(dataKey);
        datadef = runtimeActivity.createDatadef({
          points: this.data,
          xLabel: this.xLabel,
          xUnitsRef: this.xUnitsRef,
          yLabel: this.yLabel,
          yUnitsRef: this.yUnitsRef
        });
        return runtimeActivity.defineDatadef(dataKey, datadef);
      }
    };
    PredefinedGraphPane.prototype.addToStep = function(step) {
      return step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index
      });
    };
    return PredefinedGraphPane;
  })();
  AuthorPane.classFor['ImagePane'] = ImagePane = (function() {
    function ImagePane(_arg, index) {
      this.url = _arg.url, this.license = _arg.license, this.attribution = _arg.attribution;
      this.index = index;
    }
    ImagePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {};
    ImagePane.prototype.addToStep = function(step) {
      return step.addImagePane({
        url: this.url,
        license: this.license,
        attribution: this.attribution,
        index: this.index
      });
    };
    return ImagePane;
  })();
  AuthorPane.classFor['TablePane'] = TablePane = (function() {
    function TablePane(_arg, index) {
      _arg;
      this.index = index;
    }
    TablePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      this.runtimeActivity = runtimeActivity;
    };
    TablePane.prototype.addToStep = function(step) {
      var dataKey, datadefRef, otherPaneIndex;
      otherPaneIndex = 1 - this.index;
      dataKey = "" + this.page.name + "-" + otherPaneIndex;
      datadefRef = this.runtimeActivity.getDatadefRef(dataKey);
      return step.addTablePane({
        datadefRef: datadefRef,
        index: this.index
      });
    };
    return TablePane;
  })();
}).call(this);
