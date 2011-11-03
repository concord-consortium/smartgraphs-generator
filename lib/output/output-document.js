(function() {
  var OutputActivity, OutputAxis, OutputDocument, OutputPage, OutputStep, OutputUnit, slugify;
  slugify = require('../slugify').slugify;
  OutputActivity = require('./output-activity').OutputActivity;
  OutputPage = require('./output-page').OutputPage;
  OutputStep = require('./output-step').OutputStep;
  OutputUnit = require('./output-unit').OutputUnit;
  OutputAxis = require('./output-axis').OutputAxis;
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
    OutputDocument.prototype.baseUrl = function() {
      return this.activity.url();
    };
    OutputDocument.prototype.createActivity = function(hash) {
      var activity;
      this.activity = activity = new OutputActivity(this, hash);
      this.hash.activity = activity.hash;
      this.hash._id = "" + (slugify(activity.hash.title)) + ".df6";
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
    OutputDocument.prototype.createUnit = function(hash) {
      var unit;
      unit = new OutputUnit(this, hash);
      this.hash.units.push(unit.hash);
      return unit;
    };
    OutputDocument.prototype.createAxis = function(hash) {
      var axis, index, _base;
      index = this.hash.axes.length + 1;
      axis = new OutputAxis(this, index, hash);
      this.hash.axes.push(axis.hash);
      (_base = this.activity.hash).axes || (_base.axes = []);
      this.activity.hash.axes.push(axis.url());
      return axis;
    };
    return OutputDocument;
  })();
}).call(this);
