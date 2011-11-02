(function() {
  var AuthorPage, RuntimePage;
  RuntimePage = require('../runtime/runtime-page').RuntimePage;
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
        if (type === 'ImagePane') {
          this.addImagePane(step, pane);
        } else if (type === 'GraphPane') {
          this.addGraphPane(step, pane);
        } else {
          throw new Error("Only ImagePanes and GraphPanes are supported right now");
        }
      }
      return runtimePage;
    };
    AuthorPage.prototype.addImagePane = function(step, pane) {
      var attribution, license, url;
      url = pane.url, license = pane.license, attribution = pane.attribution;
      return step.addImagePane(url, license, attribution);
    };
    AuthorPage.prototype.addGraphPane = function(step, pane) {
      var title, xAxis, yAxis;
      title = pane.title, xAxis = pane.xAxis, yAxis = pane.yAxis;
      return step.addGraphPane(title, xAxis, yAxis);
    };
    return AuthorPage;
  })();
}).call(this);
