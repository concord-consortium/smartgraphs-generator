(function() {
  var AuthorPane, GraphPane, ImagePane, PredefinedGraphPane, PredictionGraphPane, SensorGraphPane, TablePane, dumbSingularize, expressionParser,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  dumbSingularize = require('../singularize').dumbSingularize;

  expressionParser = require('./expressionParser').expressionParser;

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
      var includeAnnotationsFrom;
      this.title = _arg.title, this.xLabel = _arg.xLabel, this.xUnits = _arg.xUnits, this.xMin = _arg.xMin, this.xMax = _arg.xMax, this.xTicks = _arg.xTicks, this.yLabel = _arg.yLabel, this.yUnits = _arg.yUnits, this.yMin = _arg.yMin, this.yMax = _arg.yMax, this.yTicks = _arg.yTicks, includeAnnotationsFrom = _arg.includeAnnotationsFrom, this.showCrossHairs = _arg.showCrossHairs, this.showGraphGrid = _arg.showGraphGrid, this.showToolTipCoords = _arg.showToolTipCoords, this.xPrecision = _arg.xPrecision, this.yPrecision = _arg.yPrecision, this.expression = _arg.expression, this.lineType = _arg.lineType, this.pointType = _arg.pointType, this.lineSnapDistance = _arg.lineSnapDistance;
      this.annotationSources = includeAnnotationsFrom != null ? includeAnnotationsFrom.map(function(source) {
        var page, pane, _ref;
        _ref = (source.match(/^page\/(\d)+\/pane\/(\d)+$/)).slice(1, 3).map(function(s) {
          return parseInt(s, 10) - 1;
        }), page = _ref[0], pane = _ref[1];
        return {
          page: page,
          pane: pane
        };
      }) : void 0;
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
          yUnitsRef: this.yUnitsRef,
          lineType: this.lineType,
          pointType: this.pointType,
          lineSnapDistance: this.lineSnapDistance
        });
        return runtimeActivity.defineDatadef(dataKey, datadef);
      }
    };

    GraphPane.prototype.addToStep = function(step) {
      var _ref,
        _this = this;
      step.addGraphPane({
        title: this.title,
        datadefRef: this.datadefRef,
        xAxis: this.xAxis,
        yAxis: this.yAxis,
        index: this.index,
        showCrossHairs: this.showCrossHairs,
        showGraphGrid: this.showGraphGrid,
        showToolTipCoords: this.showToolTipCoords
      });
      return (_ref = this.annotationSources) != null ? _ref.forEach(function(source) {
        var page, pages, pane;
        pages = _this.page.activity.pages;
        page = pages[source.page];
        pane = page != null ? page.panes[source.pane] : void 0;
        if (!(page != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the page.");
        }
        if (!(pane != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the pane.");
        }
        if (!(pane.annotation != null)) {
          throw new Error("When attempting to include annotations from pane " + (pane + 1) + " of page " + (page + 1) + ", couldn't find the annotation.");
        }
        return step.addAnnotationToPane({
          index: source.pane,
          annotation: pane.annotation
        });
      }) : void 0;
    };

    return GraphPane;

  })();

  AuthorPane.classFor['PredefinedGraphPane'] = PredefinedGraphPane = (function(_super) {

    __extends(PredefinedGraphPane, _super);

    function PredefinedGraphPane(_arg) {
      this.data = _arg.data;
      PredefinedGraphPane.__super__.constructor.apply(this, arguments);
    }

    PredefinedGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      var expressionData;
      PredefinedGraphPane.__super__.addToPageAndActivity.apply(this, arguments);
      if (this.expression !== null && this.expression !== void 0) {
        expressionData = expressionParser.parseExpression(this.expression);
        if ((expressionData.type != null) && expressionData.type !== "not supported") {
          return this.dataRef = runtimeActivity.createDataRef({
            expressionType: expressionData.type,
            xInterval: this.xPrecision,
            expressionForm: expressionData.form,
            expression: this.expression,
            angularFunction: expressionData.angularFunction,
            params: expressionData.params,
            datadefname: this.datadefRef.datadef.name
          });
        }
      }
    };

    PredefinedGraphPane.prototype.addToStep = function(step) {
      PredefinedGraphPane.__super__.addToStep.apply(this, arguments);
      if (this.dataRef != null) {
        return step.addDataRefToPane({
          index: this.index,
          dataRef: this.dataRef
        });
      }
    };

    return PredefinedGraphPane;

  })(GraphPane);

  AuthorPane.classFor['SensorGraphPane'] = SensorGraphPane = (function(_super) {

    __extends(SensorGraphPane, _super);

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

  })(GraphPane);

  AuthorPane.classFor['PredictionGraphPane'] = PredictionGraphPane = (function(_super) {

    __extends(PredictionGraphPane, _super);

    function PredictionGraphPane(_arg) {
      this.predictionType = _arg.predictionType;
      PredictionGraphPane.__super__.constructor.apply(this, arguments);
    }

    PredictionGraphPane.prototype.addToPageAndActivity = function(runtimePage, runtimeActivity) {
      PredictionGraphPane.__super__.addToPageAndActivity.apply(this, arguments);
      return this.annotation = runtimeActivity.createAndAppendAnnotation({
        type: 'FreehandSketch'
      });
    };

    PredictionGraphPane.prototype.addToStep = function(step, _arg) {
      var isActiveInputPane, previousAnnotation, uiBehavior;
      isActiveInputPane = _arg.isActiveInputPane, previousAnnotation = _arg.previousAnnotation;
      PredictionGraphPane.__super__.addToStep.apply(this, arguments);
      if (isActiveInputPane) {
        uiBehavior = this.predictionType === "continuous_curves" ? "freehand" : "extend";
        step.addPredictionTool({
          index: this.index,
          datadefRef: this.datadefRef,
          annotation: this.annotation,
          uiBehavior: uiBehavior
        });
        step.addAnnotationToPane({
          index: this.index,
          annotation: this.annotation
        });
      }
      if (previousAnnotation) {
        return step.addAnnotationToPane({
          index: this.index,
          annotation: previousAnnotation
        });
      }
    };

    return PredictionGraphPane;

  })(GraphPane);

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
