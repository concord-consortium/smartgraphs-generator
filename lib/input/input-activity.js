(function() {
  /*
    Input "Activity" object.
  
    This class is built from an input hash (in the 'semantic JSON' format) and instantiates and manages child objects
    which represent the different model objects of the semantic JSON format.
  
    The various subtypes of pages will know how to call 'builder' methods on the output.* classes to insert elements as
    needed.
  
    For example, an input.sensorPage would have to know to call methods like output.Activity.addGraph and
    output.Activity.addDataset, as well as mehods such as, perhaps, output.Activity.appendPage, output.Page.appendStep,
    and output.Step.addTool('sensor')
  
    The complexity of processing the input tree and deciding which builder methods on the output Page, output Step, etc
    to call mostly belong here. We expect there will be a largish and growing number of classes and subclasses in the
    input.* group, and that the output.* classes mostly just need to help keep the 'accounting' straight when the input.*
    classes call builder methods on them.
  */
  var InputActivity, InputPage, OutputActivity;
  InputPage = require('./input-page').InputPage;
  OutputActivity = require('../output/output-activity').OutputActivity;
  exports.InputActivity = InputActivity = (function() {
    function InputActivity(hash) {
      var i, page;
      this.hash = hash;
      if (this.hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: InputActivity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name, this.owner = hash.owner;
      this.owner || (this.owner = 'shared');
      this.pages = (function() {
        var _len, _ref, _results;
        _ref = hash.pages;
        _results = [];
        for (i = 0, _len = _ref.length; i < _len; i++) {
          page = _ref[i];
          _results.push(new InputPage(page, this, i + 1));
        }
        return _results;
      }).call(this);
    }
    InputActivity.prototype.toOutputActivity = function() {
      var page, ret, _i, _len, _ref;
      ret = new OutputActivity(this);
      _ref = this.pages;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        ret.appendPage(page.toOutputPage());
      }
      return ret;
    };
    return InputActivity;
  })();
}).call(this);