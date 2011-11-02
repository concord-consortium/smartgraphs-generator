(function() {
  /*
    Input "Activity" object.
  
    This class is built from an input hash (in the 'semantic JSON' format) and instantiates and manages child objects
    which represent the different model objects of the semantic JSON format.
  
    The various subtypes of pages will know how to call 'builder' methods on the output.* classes to insert elements as
    needed.
  
    For example, an input.sensorPage would have to know to call methods like RuntimeActivity.addGraph and
    RuntimeActivity.addDataset, as well as mehods such as, perhaps, RuntimeActivity.appendPage, RuntimePage.appendStep,
    and Step.addTool('sensor')
  
    The complexity of processing the input tree and deciding which builder methods on the output Page, output Step, etc
    to call mostly belong here. We expect there will be a largish and growing number of classes and subclasses in the
    input/ group, and that the output/ classes mostly just need to help keep the 'accounting' straight when the input/
    classes call builder methods on them.
  */
  var AuthorActivity, AuthorPage, RuntimeActivity;
  AuthorPage = require('./author-page').AuthorPage;
  RuntimeActivity = require('../runtime/runtime-activity').RuntimeActivity;
  exports.AuthorActivity = AuthorActivity = (function() {
    function AuthorActivity(hash) {
      var i, page;
      this.hash = hash;
      if (this.hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: AuthorActivity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name, this.owner = hash.owner;
      this.owner || (this.owner = 'shared');
      this.pages = (function() {
        var _len, _ref, _results;
        _ref = hash.pages;
        _results = [];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          page = _ref[i];
          _results.push(new AuthorPage(page, this, i + 1));
        }
        return _results;
      }).call(this);
    }
    AuthorActivity.prototype.toRuntimeActivity = function() {
      var page, ret, _i, _len, _ref;
      ret = new RuntimeActivity(this.owner, this.name);
      _ref = this.pages;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        ret.appendPage(page.toRuntimePage());
      }
      return ret;
    };
    return AuthorActivity;
  })();
}).call(this);
