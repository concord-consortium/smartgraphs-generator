(function() {
  /*
    Output "Activity" object.
  
    This class maintains a set of child objects that represent something close to the output "Smartgraphs runtime JSON"
    format and has a toHash method to generate that format. (However, this class will likely maintain model objects that
    aren't explicitly represented in the final output hash or in the Smartgraphs runtime; for example, having an
    output.Graph class makes sense, even though the output hash is 'denormalized' and doesn't have an explicit
    representation of a Graph)
  
    Mostly, this class and the classes of its contained child objects implement builder methods that the input.* objects
    know how to call.
  */
  var OutputActivity, OutputPage, slugify;
  slugify = require('../slugify').slugify;
  OutputPage = require('./output-page').OutputPage;
  exports.OutputActivity = OutputActivity = (function() {
    function OutputActivity(owner, name) {
      this.owner = owner;
      this.name = name;
      this.url = "/" + this.owner + "/" + (slugify(this.name));
      this.pages = [];
      this.steps = [];
    }
    OutputActivity.prototype.appendPage = function(outputPage) {
      this.pages.push(outputPage);
      outputPage.activity = this;
      outputPage.index = this.pages.length;
      return outputPage;
    };
    OutputActivity.prototype.toHash = function() {
      var flatten, page, step;
      flatten = function(arrays) {
        var _ref;
        return (_ref = []).concat.apply(_ref, arrays);
      };
      return {
        _id: 'marias-run-generated-target.df6',
        _rev: 1,
        data_format_version: 6,
        activity: {
          title: this.name,
          url: this.url,
          owner: this.owner,
          pages: (function() {
            var _i, _len, _ref, _results;
            _ref = this.pages;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              page = _ref[_i];
              _results.push(page.url());
            }
            return _results;
          }).call(this)
        },
        pages: (function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push(page.toHash());
          }
          return _results;
        }).call(this),
        steps: flatten((function() {
          var _i, _len, _ref, _results;
          _ref = this.pages;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            page = _ref[_i];
            _results.push((function() {
              var _j, _len2, _ref2, _results2;
              _ref2 = page.steps;
              _results2 = [];
              for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
                step = _ref2[_j];
                _results2.push(step.toHash());
              }
              return _results2;
            })());
          }
          return _results;
        }).call(this)),
        responseTemplates: [],
        axes: [],
        datadefs: [],
        tags: [],
        annotations: [],
        variables: [],
        units: []
      };
    };
    return OutputActivity;
  })();
}).call(this);
