(function() {
  var AuthorPage, AuthorPane, Sequence;
  Sequence = require('./sequences').Sequence;
  AuthorPane = require('./author-panes').AuthorPane;
  exports.AuthorPage = AuthorPage = (function() {
    function AuthorPage(hash, activity, index) {
      var h, pane, _len, _ref, _ref2, _ref3, _ref4;
      this.hash = hash;
      this.activity = activity;
      this.index = index;
      _ref = this.hash, this.name = _ref.name, this.text = _ref.text;
      this.sequence = Sequence.fromHash(this.hash.sequence);
      this.sequence.page = this;
      if (((_ref2 = this.hash.panes) != null ? _ref2.length : void 0) > 2) {
        throw new Error("There cannot be more than two panes");
      }
      this.panes = this.hash.panes != null ? (function() {
        var _i, _len, _ref3, _results;
        _ref3 = this.hash.panes;
        _results = [];
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          h = _ref3[_i];
          _results.push(AuthorPane.fromHash(h));
        }
        return _results;
      }).call(this) : [];
      _ref3 = this.panes;
      for (index = 0, _len = _ref3.length; index < _len; index++) {
        pane = _ref3[index];
        _ref4 = [this, index], pane.page = _ref4[0], pane.index = _ref4[1];
      }
    }
    AuthorPage.prototype.toRuntimePage = function(runtimeActivity) {
      var pane, runtimePage, _i, _len, _ref;
      runtimePage = runtimeActivity.createPage();
      runtimePage.setName(this.name);
      runtimePage.setText(this.text);
      _ref = this.panes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        pane.addToPageAndActivity(runtimePage, runtimeActivity);
      }
      this.sequence.appendSteps(runtimePage);
      return runtimePage;
    };
    return AuthorPage;
  })();
}).call(this);
