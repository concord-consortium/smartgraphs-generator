
/*
  "Activity" object in author forat.

  This class is built from an input hash (in the 'semantic JSON' format) and instantiates and manages child objects
  which represent the different model objects of the semantic JSON format.

  The various subtypes of pages will know how to call 'builder' methods on the runtime.* classes to insert elements as
  needed.

  For example, an author.sensorPage would have to know to call methods like RuntimeActivity.addGraph and
  RuntimeActivity.addDataset, as well as mehods such as, perhaps, RuntimeActivity.appendPage, RuntimePage.appendStep,
  and Step.addTool('sensor')

  The complexity of processing the input tree and deciding which builder methods on the runtime Page, runtime Step, etc
  to call mostly belong here. We expect there will be a largish and growing number of classes and subclasses in the
  author/ group, and that the runtime/ classes mostly just need to help keep the 'accounting' straight when the author/
  classes call builder methods on them.
*/

(function() {
  var AuthorActivity, AuthorPage, AuthorUnit, RuntimeActivity;

  AuthorPage = require('./author-page').AuthorPage;

  AuthorUnit = require('./author-unit').AuthorUnit;

  RuntimeActivity = require('../runtime/runtime-activity').RuntimeActivity;

  exports.AuthorActivity = AuthorActivity = (function() {

    function AuthorActivity(hash) {
      var i, page, unit;
      this.hash = hash;
      if (this.hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: AuthorActivity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name, this.owner = hash.owner, this.authorName = hash.authorName;
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
      this.units = (function() {
        var _i, _len, _ref, _results;
        _ref = hash.units || [];
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          unit = _ref[_i];
          _results.push(new AuthorUnit(unit, this));
        }
        return _results;
      }).call(this);
    }

    AuthorActivity.prototype.toRuntimeActivity = function() {
      var page, runtimeActivity, runtimeUnit, unit, _i, _j, _len, _len2, _ref, _ref2;
      runtimeActivity = new RuntimeActivity(this.owner, this.name, this.authorName, this.hash.datasets);
      _ref = this.units;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        unit = _ref[_i];
        runtimeActivity.defineUnit((runtimeUnit = unit.toRuntimeUnit(runtimeActivity)).name, runtimeUnit);
      }
      _ref2 = this.pages;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        page = _ref2[_j];
        runtimeActivity.appendPage(page.toRuntimePage(runtimeActivity));
      }
      return runtimeActivity;
    };

    return AuthorActivity;

  })();

}).call(this);
