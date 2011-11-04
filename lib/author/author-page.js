(function() {
  var AuthorPage, dumbSingularize;
  dumbSingularize = require('../singularize').dumbSingularize;
  exports.AuthorPage = AuthorPage = (function() {
    function AuthorPage(hash, activity, index) {
      var _ref;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text, this.panes = _ref.panes;
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var pane, runtimePage, step, type, _ref;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      step = runtimePage.appendStep();
      if (((_ref = this.panes) != null ? _ref.length : void 0) > 0) {
        if (this.panes.length > 1) {
          throw new Error("Only one pane is supported right now");
        }
        pane = this.panes[0];
        type = pane.type;
        switch (type) {
          case 'ImagePane':
            this.addImagePane(step, pane);
            break;
          case 'PredefinedGraphPane':
            this.addPredefinedGraphPane(step, pane, runtimeActivity);
            break;
          default:
            throw new Error("Only ImagePanes and PredefinedGraphPane are supported right now");
        }
      }
      return runtimePage;
    };
    AuthorPage.prototype.addImagePane = function(step, pane) {
      var attribution, license, url;
      url = pane.url, license = pane.license, attribution = pane.attribution;
      return step.addImagePane(url, license, attribution);
    };
    AuthorPage.prototype.addPredefinedGraphPane = function(step, pane, runtimeActivity) {
      var data, datadef, title, xAxis, xLabel, xMax, xMin, xTicks, xUnits, xUnitsRef, yAxis, yLabel, yMax, yMin, yTicks, yUnits, yUnitsRef;
      title = pane.title, data = pane.data, xLabel = pane.xLabel, xUnits = pane.xUnits, xMin = pane.xMin, xMax = pane.xMax, xTicks = pane.xTicks, yLabel = pane.yLabel, yUnits = pane.yUnits, yMin = pane.yMin, yMax = pane.yMax, yTicks = pane.yTicks;
      xUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(xUnits));
      yUnitsRef = runtimeActivity.getUnitRef(dumbSingularize(yUnits));
      xAxis = runtimeActivity.createAndAppendAxis({
        label: xLabel,
        unitRef: xUnitsRef,
        min: xMin,
        max: xMax,
        nSteps: xTicks
      });
      yAxis = runtimeActivity.createAndAppendAxis({
        label: yLabel,
        unitRef: yUnitsRef,
        min: yMin,
        max: yMax,
        nSteps: yTicks
      });
      if (data != null) {
        datadef = runtimeActivity.createAndAppendDatadef({
          points: data,
          xLabel: xLabel,
          xUnitsRef: xUnitsRef,
          yLabel: yLabel,
          yUnitsRef: yUnitsRef
        });
      }
      return step.addGraphPane({
        title: title,
        datadef: datadef,
        xAxis: xAxis,
        yAxis: yAxis
      });
    };
    return AuthorPage;
  })();
}).call(this);
