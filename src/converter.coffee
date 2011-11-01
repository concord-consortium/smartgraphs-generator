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
    
    outputStep = outputPage.appendStep
      paneConfig: 'single'
      panes: null
      isFinalStep: true
      nextButtonShouldSubmit: true

    if page.panes
      for pane in page.panes
        switch pane.type
          when 'ImagePane'
            outputStep.appendPane
              type: 'image'
              path: pane.url
              caption: "#{pane.license} #{pane.attribution}"

  outputDocument.hash  