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
      var datadefRef, index, title, xAxis, yAxis;
      title = _arg.title, datadefRef = _arg.datadefRef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, index = _arg.index;
      return this.panes[index] = {
        title: title,
        datadefRef: datadefRef,
        xAxis: xAxis,
        yAxis: yAxis,
        annotations: [],
        toHash: function() {
          var annotation;
          return {
            type: 'graph',
            title: this.title,
            xAxis: this.xAxis.getUrl(),
            yAxis: this.yAxis.getUrl(),
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
            data: this.datadefRef != null ? [this.datadefRef.datadef.name] : []
          };
        }
      };
    };

    Step.prototype.addTablePane = function(_arg) {
      var datadefRef, index;
      datadefRef = _arg.datadefRef, index = _arg.index;
      return this.panes[index] = {
        datadefRef: datadefRef,
        annotations: [],
        toHash: function() {
          var annotation;
          return {
            type: 'table',
            data: this.datadefRef.datadef.name,
            annotations: (function() {
              var _i, _len, _ref, _results;
              _ref = this.annotations;
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

    Step.prototype.addTaggingTool = function(_arg) {
      var datadefRef, tag;
      tag = _arg.tag, datadefRef = _arg.datadefRef;
      return this.tools['tagging'] = {
        tag: tag,
        datadefRef: datadefRef,
        toHash: function() {
          return {
            name: 'tagging',
            setup: {
              tag: this.tag.name,
              data: this.datadefRef.datadef.name
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
      var branch, key, panesHash, tool, toolsHash, _ref, _ref2;
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
        nextButtonShouldSubmit: this.nextButtonShouldSubmit
      };
    };

    return Step;

  })();

}).call(this);
