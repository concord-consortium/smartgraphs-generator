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
      this.datadefRef = null;
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var i, pane, runtimePage, step, type, _len, _ref, _ref2;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      step = runtimePage.appendStep();
      if (((_ref = this.panes) != null ? _ref.length : void 0) > 0) {
        if (this.panes.length > 2) {
          throw new Error("There cannot be more than two panes");
        }
        _ref2 = this.panes;
        for (i = 0, _len = _ref2.length; i < _len; i++) {
          pane = _ref2[i];
          type = pane.type;
          switch (type) {
            case 'ImagePane':
              this.addImagePane(step, pane, i);
              break;
            case 'PredefinedGraphPane':
              this.addPredefinedGraphPane(step, pane, runtimeActivity, i);
              break;
            case 'TablePane':
              this.addTablePane(step, pane, runtimeActivity, i);
              break;
            default:
              throw new Error("Only ImagePanes, PredefinedGraphPanes and TablePanes are supported right now");
          }
        }
      }
      return runtimePage;
    };
    AuthorPage.prototype.addImagePane = function(step, pane, index) {
      var attribution, license, url;
      url = pane.url, license = pane.license, attribution = pane.attribution;
      return step.addImagePane({
        url: url,
        license: license,
        attribution: attribution,
        index: index
      });
    };
    AuthorPage.prototype.addPredefinedGraphPane = function(step, pane, runtimeActivity, index) {
      var data, datadef, title, xAxis, xLabel, xMax, xMin, xTicks, xUnits, xUnitsRef, yAxis, yLabel, yMax, yMin, yTicks, yUnits, yUnitsRef, _ref;
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
        if ((_ref = this.datadefRef) == null) {
          this.datadefRef = runtimeActivity.getDatadefRef(this.name);
        }
        datadef = runtimeActivity.createDatadef({
          points: data,
          xLabel: xLabel,
          xUnitsRef: xUnitsRef,
          yLabel: yLabel,
          yUnitsRef: yUnitsRef
        });
        runtimeActivity.defineDatadef(this.name, datadef);
      }
      return step.addGraphPane({
        title: title,
        datadefRef: this.datadefRef,
        xAxis: xAxis,
        yAxis: yAxis,
        index: index
      });
    };
    AuthorPage.prototype.addTablePane = function(step, pane, runtimeActivity, index) {
      var _ref;
      if ((_ref = this.datadefRef) == null) {
        this.datadefRef = runtimeActivity.getDatadefRef(this.name);
      }
      return step.addTablePane({
        datadefRef: this.datadefRef,
        index: index
      });
    };
    return AuthorPage;
  })();
}).call(this);
