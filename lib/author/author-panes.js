(function() {
  var AuthorPane, ImagePane, PredefinedGraphPane, TablePane, dumbSingularize;
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
  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function() {
    function PredefinedGraphPane(_arg) {
      this.title = _arg.title, this.data = _arg.data, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks;
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
