(function() {
  var Step;
  exports.Step = Step = (function() {
    function Step() {
      this.panesHash = null;
      this.page = null;
      this.index = null;
    }
    Step.prototype.addImagePane = function(url, license, attribution, numPanes, index) {
      var _ref;
      if ((_ref = this.panesHash) == null) {
        this.panesHash = {};
      }
      return this.panesHash[this.getPaneKey(numPanes, index)] = {
        type: 'image',
        path: url,
        caption: "" + license + " " + attribution
      };
    };
    Step.prototype.addGraphPane = function(_arg) {
      var datadef, index, numPanes, title, xAxis, yAxis, _ref;
      title = _arg.title, datadef = _arg.datadef, xAxis = _arg.xAxis, yAxis = _arg.yAxis, numPanes = _arg.numPanes, index = _arg.index;
      if ((_ref = this.panesHash) == null) {
        this.panesHash = {};
      }
      return this.panesHash[this.getPaneKey(numPanes, index)] = {
        type: 'graph',
        title: title,
        xAxis: xAxis.getUrl(),
        yAxis: yAxis.getUrl(),
        annotations: [],
        data: datadef != null ? [datadef.name] : []
      };
    };
    Step.prototype.addTablePane = function(data, numPanes, index) {
      var _ref;
      if ((_ref = this.panesHash) == null) {
        this.panesHash = {};
      }
      return this.panesHash[this.getPaneKey(numPanes, index)] = {
        type: 'table',
        data: data,
        annotations: []
      };
    };
    Step.prototype.setIndex = function(index) {
      this.index = index;
      return this.index;
    };
    Step.prototype.getUrl = function() {
      return "" + (this.page.getUrl()) + "/step/" + this.index;
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
    Step.prototype.findGraphData = function() {
      var key, pane, _ref, _ref2;
      _ref = this.panesHash;
      for (key in _ref) {
        pane = _ref[key];
        if (pane.type === 'graph') {
          return (_ref2 = pane.data) != null ? _ref2[0] : void 0;
        }
      }
    };
    Step.prototype.setTableData = function(data) {
      var key, pane, _ref, _results;
      _ref = this.panesHash;
      _results = [];
      for (key in _ref) {
        pane = _ref[key];
        _results.push(pane.type === 'table' ? pane.data = data : void 0);
      }
      return _results;
    };
    Step.prototype.toHash = function() {
      var _ref;
      return {
        url: this.getUrl(),
        activityPage: this.page.getUrl(),
        paneConfig: ((_ref = this.panesHash) != null ? _ref.top : void 0) != null ? 'split' : 'single',
        panes: this.panesHash,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      };
    };
    return Step;
  })();
}).call(this);
