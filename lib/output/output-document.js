(function() {
  var OutputActivity, OutputAxis, OutputData, OutputDocument, OutputPage, OutputStep, OutputUnit, slugify;
  slugify = require('../slugify').slugify;
  OutputActivity = require('./output-activity').OutputActivity;
  OutputPage = require('./output-page').OutputPage;
  OutputStep = require('./output-step').OutputStep;
  OutputUnit = require('./output-unit').OutputUnit;
  OutputAxis = require('./output-axis').OutputAxis;
  OutputData = require('./output-data').OutputData;
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
    OutputDocument.prototype.createData = function(hash) {
      var data, index, item, unorderedDataPoints;
      unorderedDataPoints = ((function() {
        var _i, _len, _ref, _results;
        _ref = this.hash.datadefs;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          if (item.type === "UnorderedDataPoints") {
            _results.push(item);
          }
        }
        return _results;
      }).call(this))[0];
      if (!unorderedDataPoints) {
        this.hash.datadefs.push(unorderedDataPoints = {
          type: "UnorderedDataPoints",
          records: []
        });
      }
      index = unorderedDataPoints.records.length + 1;
      data = new OutputData(this, "unordered", index, hash);
      unorderedDataPoints.records.push(data.hash);
      return data;
    };
    return OutputDocument;
  })();
}).call(this);
