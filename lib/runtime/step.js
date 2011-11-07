(function() {
  var Step;
  exports.Step = Step = (function() {
    function Step(sequence) {
      var _ref;
      this.sequence = sequence;
      this.panes = [];
      this.page = null;
      this.index = null;
      if (((_ref = this.sequence) != null ? _ref.type : void 0) === "InstructionSequence") {
        this.beforeText = this.sequence.text;
      }
    }
    Step.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
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
        toHash: function() {
          return {
            type: 'graph',
            title: this.title,
            xAxis: this.xAxis.getUrl(),
            yAxis: this.yAxis.getUrl(),
            annotations: [],
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
        toHash: function() {
          return {
            type: 'table',
            data: this.datadefRef.datadef.name,
            annotations: []
          };
        }
      };
    };
    Step.prototype.getPaneKey = function(numPanes, index) {
      if (numPanes === 1) {
        return "single";
      } else if (index === 0) {
        return "top";
      } else {
        return "bottom";
      }
    };
    Step.prototype.toHash = function() {
      var panesHash;
      panesHash = this.panes.length === 1 ? {
        single: this.panes[0].toHash()
      } : this.panes.length === 2 ? {
        top: this.panes[0].toHash(),
        bottom: this.panes[1].toHash()
      } : void 0;
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        paneConfig: this.panes.length === 2 ? 'split' : 'single',
        panes: panesHash != null ? panesHash : null,
        isFinalStep: true,
        nextButtonShouldSubmit: true,
        beforeText: this.beforeText
      };
    };
    return Step;
  })();
}).call(this);
