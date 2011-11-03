{OutputDocument} = require './output/output-document'

exports.convert = (input) ->
  outputDocument = new OutputDocument
  outputUnits = {}

  outputActivity = outputDocument.createActivity
    title: input.name
    owner: input.owner || 'shared'

  if input.units
    for unit in input.units
      outputUnits[unit.name] = outputDocument.createUnit
        name: unit.name.replace /s$/, ''
        abbreviation: unit.abbreviation
        pluralName: unit.name
        activity: null

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
        console.log "found #{pane.type} pane"
        switch pane.type
          when 'ImagePane'
            outputStep.appendPane
              type: 'image'
              path: pane.url
              caption: "#{pane.license} #{pane.attribution}"
          when 'PredefinedGraphPane'
            xAxis = outputDocument.createAxis
              min: pane.xMin
              max: pane.xMax
              nSteps: pane.xTicks
              label: pane.xLabel
              units: outputUnits[pane.xUnits].url()
            yAxis = outputDocument.createAxis
              min: pane.yMin
              max: pane.yMax
              nSteps: pane.yTicks
              label: pane.yLabel
              units: outputUnits[pane.yUnits].url()
            if pane.data
              data = outputDocument.createData
                points: pane.data
                xUnits: outputUnits[pane.xUnits].url()
                yUnits: outputUnits[pane.yUnits].url()
                xLabel: pane.xLabel
                yLabel: pane.yLabel
                xShortLabel: pane.xLabel
                yShortLabel: pane.yLabel
            outputStep.appendPane
              type: 'graph'
              title: pane.title
              xAxis: xAxis.url()
              yAxis: yAxis.url()
              data: if data then [data.name()] else undefined
              annotations: []

  outputDocument.hash