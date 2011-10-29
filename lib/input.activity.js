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
  var Activity, Page;
  Page = require('./input.page').Page;
  exports.Activity = Activity = (function() {
    function Activity(hash) {
      var page;
      this.hash = hash;
      if (hash.type !== 'Activity') {
        throw new Error("smartgraphs-generator: input.Activity constructor was called with a hash whose toplevel element does not have type: \"Activity\"");
      }
      this.name = hash.name;
      this.url = '/shared/marias_run';
      this.pages = (function() {
        var _i, _len, _ref, _results;
        _ref = hash.pages;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          page = _ref[_i];
          _results.push(new Page(page, this, _i + 1));
        }
        return _results;
      }).call(this);
    }
    Activity.prototype.convert = function() {
      var page, _i, _len, _ref, _results;
      _ref = this.pages;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        _results.push(page.convert());
      }
      return _results;
    };
    Activity.prototype.process = function(output) {
      var page, _i, _len, _ref, _results;
      output.activity = {
        title: this.name,
        url: this.url,
        owner: 'shared',
        pages: (function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push(page.url);
          }
          return _results;
        }).call(this)
      };
      output.pages = [];
      output.steps = [];
      output.responseTemplates = [];
      output.axes = [];
      output.datadefs = [];
      output.tags = [];
      output.annotations = [];
      output.variables = [];
      output.units = [];
      _ref = this.pages;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        page = _ref[_i];
        _results.push(page.process(output));
      }
      return _results;
    };
    return Activity;
  })();
}).call(this);
