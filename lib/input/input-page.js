(function() {
  var InputPage, OutputPage;
  OutputPage = require('../output/output-page').OutputPage;
  exports.InputPage = InputPage = (function() {
    function InputPage(hash, activity, index) {
      var _ref;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text, this.panes = _ref.panes;
    }
    InputPage.prototype.toOutputPage = function() {
      var attribution, license, pane, ret, step, type, url, _ref;
      ret = new OutputPage(this);
      ret.setText(this.text);
      step = ret.appendStep();
      if (((_ref = this.panes) != null ? _ref.length : void 0) > 0) {
        if (this.panes.length > 1) {
          throw new Error("Only one pane is supported right now");
        }
        pane = this.panes[0];
        type = pane.type, url = pane.url, license = pane.license, attribution = pane.attribution;
        if (type !== 'ImagePane') {
          throw new Error("Only ImagePanes are supported right now");
        }
        step.addImagePane(url, license, attribution);
      }
      return ret;
    };
    return InputPage;
  })();
}).call(this);
