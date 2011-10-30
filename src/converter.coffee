{OutputDocument} = require './output/output-document'

exports.convert = (input) ->
  outputDocument = new OutputDocument
  
  outputActivity = outputDocument.createActivity
    title: input.name
    owner: input.owner || 'shared'

  for page in input.pages
    outputPage = outputActivity.appendPage
      name: page.name
      introText: page.text
    
    outputPage.appendStep
      paneConfig: 'single'
      panes: null
      isFinalStep: true
      nextButtonShouldSubmit: true

  outputDocument.hash  