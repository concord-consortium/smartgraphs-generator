(function() {
  var OutputDocument;
  OutputDocument = require('./output/output-document').OutputDocument;
  exports.convert = function(input) {
    var outputActivity, outputDocument, outputPage, page, _i, _len, _ref;
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
      outputPage.appendStep({
        paneConfig: 'single',
        panes: null,
        isFinalStep: true,
        nextButtonShouldSubmit: true
      });
    }
    return outputDocument.hash;
  };
}).call(this);
