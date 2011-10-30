(function() {
  var OutputActivity, OutputDocument, OutputPage, OutputStep;
  OutputActivity = require('./output-activity').OutputActivity;
  OutputPage = require('./output-page').OutputPage;
  OutputStep = require('./output-step').OutputStep;
  exports.OutputDocument = OutputDocument = (function() {
    function OutputDocument() {
      this.hash = {
        _id: "marias-run-generated-target.df6",
        _rev: 1,
        data_format_version: 6,
        activity: null,
        pages: [],
        steps: [],
        responseTemplates: [],
        axes: [],
        datadefs: [],
        tags: [],
        annotations: [],
        variables: [],
        units: []
      };
    }
    OutputDocument.prototype.createActivity = function(hash) {
      var activity;
      activity = new OutputActivity(this, hash);
      this.hash.activity = activity.hash;
      return activity;
    };
    OutputDocument.prototype.createPage = function(hash) {
      var page;
      page = new OutputPage(this, hash);
      this.hash.pages.push(page.hash);
      return page;
    };
    OutputDocument.prototype.createStep = function(index, hash) {
      var step;
      step = new OutputStep(this, index, hash);
      this.hash.steps.push(step.hash);
      return step;
    };
    return OutputDocument;
  })();
}).call(this);
