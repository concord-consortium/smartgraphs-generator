(function() {
  var AuthorPane, GraphPane, ImagePane, PredefinedGraphPane, PredictionGraphPane, SensorGraphPane, TablePane, dumbSingularize;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  dumbSingularize = require('../singularize').dumbSingularize;
  AuthorPane = exports.AuthorPane = {
    classFor: {},
    fromHash: function(hash) {
      var PaneClass;
      PaneClass = this.classFor[hash.type];
      if (!(PaneClass != null)) {
        throw new Error("Pane type " + hash.type + " is not supported");
      }
      return new PaneClass(hash);
    }
  };
  GraphPane = (function() {
    function GraphPane(_arg) {
      this.title = _arg.title, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks;
    }
    GraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
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
        dataKey = "" + this.page.index + "-" + this.index;
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
    GraphPane.prototype.addToStep = function(step) {
      return step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index
      });
    };
    return GraphPane;
  })();
  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function() {
    __extends(PredefinedGraphPane, GraphPane);
    function PredefinedGraphPane(_arg) {
      this.data = _arg.data;
      PredefinedGraphPane.__super__.constructor.apply(this, arguments);
    }
    return PredefinedGraphPane;
  })();
  AuthorPane.classFor['SensorGraphPane'] = SensorGraphPane = (function() {
    __extends(SensorGraphPane, GraphPane);
    function SensorGraphPane() {
      SensorGraphPane.__super__.constructor.apply(this, arguments);
      this.data = [];
    }
    SensorGraphPane.prototype.addToStep = function(step) {
      SensorGraphPane.__super__.addToStep.apply(this, arguments);
      return step.addSensorTool({
        index: this.index,
        datadefRef: this.datadefRef
      });
    };
    return SensorGraphPane;
  })();
  AuthorPane.classFor['PredictionGraphPane'] = PredictionGraphPane = (function() {
    __extends(PredictionGraphPane, GraphPane);
    function PredictionGraphPane() {
      PredictionGraphPane.__super__.constructor.apply(this, arguments);
    }
    PredictionGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      PredictionGraphPane.__super__.addToPageAndActivity.apply(this, arguments);
      return this.annotation = runtimeActivity.createAndAppendAnnotation({
        type: 'FreehandSketch'
      });
    };
    PredictionGraphPane.prototype.addToStep = function(step) {
      PredictionGraphPane.__super__.addToStep.apply(this, arguments);
      step.addPredictionTool({
        index: this.index,
        datadefRef: this.datadefRef,
        annotation: this.annotation
      });
      return step.addAnnotationToPane({
        index: 0,
        annotation: this.annotation
      });
    };
    return PredictionGraphPane;
  })();
  AuthorPane.classFor['ImagePane'] = ImagePane = (function() {
    function ImagePane(_arg) {
      this.url = _arg.url, this.license = _arg.license, this.attribution = _arg.attribution;
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
    function TablePane() {}
    TablePane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      this.runtimeActivity = runtimeActivity;
    };
    TablePane.prototype.addToStep = function(step) {
      var dataKey, datadefRef, otherPaneIndex;
      otherPaneIndex = 1 - this.index;
      dataKey = "" + this.page.index + "-" + otherPaneIndex;
      datadefRef = this.runtimeActivity.getDatadefRef(dataKey);
      return step.addTablePane({
        datadefRef: datadefRef,
        index: this.index
      });
    };
    return TablePane;
  })();
}).call(this);
