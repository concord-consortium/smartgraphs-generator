(function() {
  var OutputDocument;
  OutputDocument = require('./output/output-document').OutputDocument;
  exports.convert = function(input) {
    var data, outputActivity, outputDocument, outputPage, outputStep, outputUnits, page, pane, unit, xAxis, yAxis, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _ref3;
    outputDocument = new OutputDocument;
    outputUnits = {};
    outputActivity = outputDocument.createActivity({
      title: input.name,
      owner: input.owner || 'shared'
    });
    if (input.units) {
      _ref = input.units;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        unit = _ref[_i];
        outputUnits[unit.name] = outputDocument.createUnit({
          name: unit.name.replace(/s$/, ''),
          abbreviation: unit.abbreviation,
          pluralName: unit.name,
          activity: null
        });
      }
    }
    _ref2 = input.pages;
    for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
      page = _ref2[_j];
      outputPage = outputActivity.appendPage({
        name: page.name,
        introText: page.text
      });
      outputStep = outputPage.appendStep({
        paneConfig: 'single',
        panes: null,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      });
      if (page.panes) {
        _ref3 = page.panes;
        for (_k = 0, _len3 = _ref3.length; _k < _len3; _k++) {
          pane = _ref3[_k];
          console.log("found " + pane.type + " pane");
          switch (pane.type) {
            case 'ImagePane':
              outputStep.appendPane({
                type: 'image',
                path: pane.url,
                caption: "" + pane.license + " " + pane.attribution
              });
              break;
            case 'PredefinedGraphPane':
              xAxis = outputDocument.createAxis({
                min: pane.xMin,
                max: pane.xMax,
                nSteps: pane.xTicks,
                label: pane.xLabel,
                units: outputUnits[pane.xUnits].url()
              });
              yAxis = outputDocument.createAxis({
                min: pane.yMin,
                max: pane.yMax,
                nSteps: pane.yTicks,
                label: pane.yLabel,
                units: outputUnits[pane.yUnits].url()
              });
              if (pane.data) {
                data = outputDocument.createData({
                  points: pane.data,
                  xUnits: outputUnits[pane.xUnits].url(),
                  yUnits: outputUnits[pane.yUnits].url(),
                  xLabel: pane.xLabel,
                  yLabel: pane.yLabel,
                  xShortLabel: pane.xLabel,
                  yShortLabel: pane.yLabel
                });
              }
              outputStep.appendPane({
                type: 'graph',
                title: pane.title,
                xAxis: xAxis.url(),
                yAxis: yAxis.url(),
                data: data ? [data.name()] : void 0,
                annotations: []
              });
          }
        }
      }
    }
    return outputDocument.hash;
  };
}).call(this);
