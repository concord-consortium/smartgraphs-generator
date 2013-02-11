(function() {
  var Step;

  exports.Step = Step = (function() {

    function Step() {
      this.panes = [];
      this.tools = {};
      this.responseBranches = [];
      this.isFinalStep = true;
      this.nextButtonShouldSubmit = true;
      this.page = null;
      this.index = null;
    }

    Step.prototype.setIndex = function(index) {
      this.index = index;
    };

    Step.prototype.setBeforeText = function(beforeText) {
      this.beforeText = beforeText;
    };

    Step.prototype.setSubmitButtonTitle = function(submitButtonTitle) {
      this.submitButtonTitle = submitButtonTitle;
    };

    Step.prototype.setDefaultBranch = function(defaultBranch) {
      this.defaultBranch = defaultBranch;
    };

    Step.prototype.setSubmissibilityCriterion = function(submissibilityCriterion) {
      this.submissibilityCriterion = submissibilityCriterion;
    };

    Step.prototype.setSubmissibilityDependsOn = function(submissibilityDependsOn) {
      this.submissibilityDependsOn = submissibilityDependsOn;
    };

    Step.prototype.setResponseTemplate = function(responseTemplate) {
      this.responseTemplate = responseTemplate;
    };

    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
    };

    Step.prototype.addImagePane = function(_arg) {
      var attribution, index, license, url;
      url = _arg.url, license = _arg.license, attribution = _arg.attribution, index = _arg.index;
      return this.panes[index] = {
        url: url,
        license: license,
        attribution: attribution,
        toHash: function() {
          return {
            type: 'image',
            path: this.url,
            caption: "" + this.license + " " + this.attribution
          };
        }
      };
    };

    Step.prototype.addGraphPane = function(_arg) {
      var activeDatasetName, dataRef, datadefRef, includedDataSets, index, sequenceType, showCrossHairs, showGraphGrid, showToolTipCoords, title, xAxis, yAxis;
      title = _arg.title, datadefRef = _arg.datadefRef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, index = _arg.index, showCrossHairs = _arg.showCrossHairs, showGraphGrid = _arg.showGraphGrid, showToolTipCoords = _arg.showToolTipCoords, includedDataSets = _arg.includedDataSets, activeDatasetName = _arg.activeDatasetName, dataRef = _arg.dataRef, sequenceType = _arg.sequenceType;
      return this.panes[index] = {
        title: title,
        datadefRef: datadefRef,
        dataRef: dataRef ? dataRef : [],
        xAxis: xAxis,
        yAxis: yAxis,
        showCrossHairs: showCrossHairs,
        showGraphGrid: showGraphGrid,
        showToolTipCoords: showToolTipCoords,
        annotations: [],
        highlightedAnnotations: [],
        includedDataSets: includedDataSets,
        activeDatasetName: activeDatasetName,
        toHash: function() {
          var annotation, datadefref, dataref, _ref, _ref2, _ref3;
          return {
            type: 'graph',
            title: this.title,
            xAxis: this.xAxis.getUrl(),
            yAxis: this.yAxis.getUrl(),
            showCrossHairs: (_ref = this.showCrossHairs) != null ? _ref : void 0,
            showGraphGrid: (_ref2 = this.showGraphGrid) != null ? _ref2 : void 0,
            showToolTipCoords: (_ref3 = this.showToolTipCoords) != null ? _ref3 : void 0,
            annotations: (function() {
              var _i, _len, _ref4, _results;
              _ref4 = this.annotations;
              _results = [];
              for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                annotation = _ref4[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            highlightedAnnotations: (function() {
              var _i, _len, _ref4, _results;
              _ref4 = this.highlightedAnnotations;
              _results = [];
              for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                annotation = _ref4[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            data: (function() {
              var _i, _len, _ref4, _results;
              if (this.datadefRef.length === 0) {
                return [];
              } else {
                _ref4 = this.datadefRef;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  datadefref = _ref4[_i];
                  _results.push(datadefref.datadef.name);
                }
                return _results;
              }
            }).call(this),
            datarefs: (function() {
              var _i, _len, _ref4, _results;
              if (this.dataRef.length === 0) {
                return;
              } else {
                _ref4 = this.dataRef;
                _results = [];
                for (_i = 0, _len = _ref4.length; _i < _len; _i++) {
                  dataref = _ref4[_i];
                  _results.push(dataref.name);
                }
                return _results;
              }
            }).call(this),
            legends: this.GetLegends(),
            activeDatadefs: this.GetActiveDatasetNames()
          };
        },
        GetActiveDatasetNames: function() {
          if (this.activeDatasetName) return [this.activeDatasetName];
        },
        GetLegends: function() {
          var datadefRef, dataset, oLegendObject, oLegends, referenceDatadef, type, _i, _j, _len, _len2, _ref, _ref2;
          if (this.includedDataSets.length !== 0) {
            title = "legend";
            referenceDatadef = "";
            type = "name";
            oLegendObject = new Object();
            oLegends = new Array();
            if (sequenceType) {
              title = sequenceType.title;
              type = sequenceType.type;
              referenceDatadef = sequenceType.referenceDatadef;
              oLegends = sequenceType.legendDataSets;
            } else {
              _ref = this.includedDataSets;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                dataset = _ref[_i];
                if (dataset.inLegend) {
                  _ref2 = this.datadefRef;
                  for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                    datadefRef = _ref2[_j];
                    if (datadefRef.datadef.name === dataset.name) {
                      oLegends.push(dataset.name);
                      break;
                    }
                  }
                }
              }
            }
            oLegendObject.title = title;
            oLegendObject.type = type;
            oLegendObject.referenceDatadef = referenceDatadef;
            oLegendObject.datadefs = oLegends;
            return oLegendObject;
          }
        }
      };
    };

    Step.prototype.addTablePane = function(_arg) {
      var datadefRef, index, xLabel, yLabel;
      datadefRef = _arg.datadefRef, index = _arg.index, xLabel = _arg.xLabel, yLabel = _arg.yLabel;
      return this.panes[index] = {
        datadefRef: datadefRef,
        annotations: [],
        highlightedAnnotations: [],
        toHash: function() {
          var annotation;
          return {
            type: 'table',
            data: this.datadefRef.datadef.name,
            xLabel: xLabel,
            yLabel: yLabel,
            annotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.annotations;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                annotation = _ref[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this),
            highlightedAnnotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.highlightedAnnotations;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                annotation = _ref[_i];
                _results.push(annotation.name);
              }
              return _results;
            }).call(this)
          };
        }
      };
    };

    Step.prototype.addAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].annotations.push(annotation);
    };

    Step.prototype.addHighlightedAnnotationToPane = function(_arg) {
      var annotation, index;
      annotation = _arg.annotation, index = _arg.index;
      return this.panes[index].highlightedAnnotations.push(annotation);
    };

    Step.prototype.addTaggingTool = function(_arg) {
      var datadefRef, labelName, tag;
      tag = _arg.tag, datadefRef = _arg.datadefRef, labelName = _arg.labelName;
      return this.tools['tagging'] = {
        tag: tag,
        datadefRef: datadefRef,
        labelName: labelName,
        toHash: function() {
          return {
            name: 'tagging',
            setup: {
              tag: this.tag.name,
              data: this.datadefRef.datadef.name,
              labelName: this.labelName
            }
          };
        }
      };
    };

    Step.prototype.addLabelTool = function(_arg) {
      var allowCoordinatesChange, datadefRef, index, labelName, markOnDataPoints;
      labelName = _arg.labelName, index = _arg.index, datadefRef = _arg.datadefRef, markOnDataPoints = _arg.markOnDataPoints, allowCoordinatesChange = _arg.allowCoordinatesChange;
      return this.tools['label'] = {
        pane: index === 0 ? 'top' : 'bottom',
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'label',
            setup: {
              pane: this.pane,
              labelName: labelName,
              markOnDataPoints: markOnDataPoints,
              datadefName: this.datadefRef.datadef.name,
              allowCoordinatesChange: allowCoordinatesChange
            }
          };
        }
      };
    };

    Step.prototype.addSensorTool = function(_arg) {
      var datadefRef, index;
      index = _arg.index, datadefRef = _arg.datadefRef;
      return this.tools['sensor'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'sensor',
            setup: {
              controlsPane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              data: this.datadefRef.datadef.name
            }
          };
        }
      };
    };

    Step.prototype.addPredictionTool = function(_arg) {
      var annotation, datadefRef, index, uiBehavior;
      index = _arg.index, datadefRef = _arg.datadefRef, annotation = _arg.annotation, uiBehavior = _arg.uiBehavior;
      return this.tools['prediction'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'prediction',
            setup: {
              pane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              uiBehavior: uiBehavior,
              annotationName: annotation.name
            }
          };
        }
      };
    };

    Step.prototype.addGraphingTool = function(_arg) {
      var annotation, datadefRef, index, shape;
      index = _arg.index, datadefRef = _arg.datadefRef, annotation = _arg.annotation, shape = _arg.shape;
      return this.tools['graphing'] = {
        index: index,
        panes: this.panes,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'graphing',
            setup: {
              pane: this.panes.length === 1 ? 'single' : this.index === 0 ? 'top' : 'bottom',
              shape: shape,
              annotationName: annotation.name,
              data: this.datadefRef.datadef.name
            }
          };
        }
      };
    };

    Step.prototype.appendResponseBranch = function(_arg) {
      var criterion, step;
      criterion = _arg.criterion, step = _arg.step;
      return this.responseBranches.push({
        criterion: criterion,
        step: step,
        toHash: function() {
          return {
            criterion: this.criterion,
            step: this.step.getUrl()
          };
        }
      });
    };

    Step.prototype.makeNonFinal = function() {
      if (this.submitButtonTitle == null) this.submitButtonTitle = "OK";
      this.isFinalStep = false;
      return delete this.nextButtonShouldSubmit;
    };

    Step.prototype.toHash = function() {
      var branch, key, panesHash, tool, toolsHash, _ref, _ref2, _ref3, _ref4;
      panesHash = this.panes.length === 1 ? {
        single: this.panes[0].toHash()
      } : this.panes.length === 2 ? {
        top: this.panes[0].toHash(),
        bottom: this.panes[1].toHash()
      } : void 0;
      toolsHash = (function() {
        var _ref, _results;
        _ref = this.tools;
        _results = [];
        for (key in _ref) {
          tool = _ref[key];
          _results.push(tool.toHash());
        }
        return _results;
      }).call(this);
      if ((this.defaultBranch != null) || this.responseBranches.length > 0) {
        this.makeNonFinal();
      }
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        beforeText: this.beforeText,
        paneConfig: this.panes.length === 2 ? 'split' : 'single',
        panes: panesHash != null ? panesHash : null,
        tools: toolsHash.length > 0 ? toolsHash : void 0,
        submitButtonTitle: this.submitButtonTitle,
        defaultBranch: this.defaultBranch != null ? this.defaultBranch.getUrl() : void 0,
        responseTemplate: this.responseTemplate != null ? this.responseTemplate.getUrl() : void 0,
        submissibilityCriterion: (_ref = this.submissibilityCriterion) != null ? _ref : void 0,
        submissibilityDependsOn: (_ref2 = this.submissibilityDependsOn) != null ? _ref2 : void 0,
        responseBranches: (function() {
          var _i, _len, _ref3, _results;
          if (this.responseBranches.length > 0) {
            _ref3 = this.responseBranches;
            _results = [];
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
              branch = _ref3[_i];
              _results.push(branch.toHash());
            }
            return _results;
          }
        }).call(this),
        isFinalStep: this.isFinalStep,
        nextButtonShouldSubmit: this.nextButtonShouldSubmit,
        variableAssignments: (_ref3 = this.variableAssignments) != null ? _ref3 : void 0,
        substitutedExpressions: (_ref4 = this.substitutedExpressions) != null ? _ref4 : void 0
      };
    };

    return Step;

  })();

}).call(this);
