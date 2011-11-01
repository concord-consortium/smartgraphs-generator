(function() {
  var OutputDocument;
  OutputDocument = require('./output/output-document').OutputDocument;
  exports.convert = function(input) {
    var outputActivity, outputDocument, outputPage, outputStep, page, pane, _i, _j, _len, _len2, _ref, _ref2;
    outputDocument = new OutputDocument;
    outputActivity = outputDocument.createActivity({
      title: input.name,
      owner: input.owner || 'shared'
    });
    _ref = input.pages;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      page = _ref[_i];
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
        _ref2 = page.panes;
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          pane = _ref2[_j];
          switch (pane.type) {
            case 'ImagePane':
              outputStep.appendPane({
                type: 'image',
                path: pane.url,
                caption: "" + pane.license + " " + pane.attribution
              });
          }
        }
      }
    }
    return outputDocument.hash;
  };
}).call(this);
