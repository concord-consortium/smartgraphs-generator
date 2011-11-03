{dumbSingularize} = require '../singularize'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text, @panes} = @hash

  toRuntimePage: (runtimeActivity) ->
    runtimePage = runtimeActivity.createPage()

    runtimePage.setName @name
    runtimePage.setText @text

    # TODO we'll want to move this logic elsewhere
    step = runtimePage.appendStep()

    if @panes?.length > 0
      if @panes.length > 1 then throw new Error "Only one pane is supported right now"
      pane = @panes[0]
      type = pane.type

      switch type
        when 'ImagePane' then @addImagePane step, pane
        when 'PredefinedGraphPane' then @addPredefinedGraphPane step, pane, runtimeActivity
        else throw new Error "Only ImagePanes and PredefinedGraphPane are supported right now"

    runtimePage

  addImagePane: (step, pane) ->
    {url, license, attribution} = pane
    step.addImagePane url, license, attribution

  addPredefinedGraphPane: (step, pane, runtimeActivity) ->

    { title,
      xLabel, xUnits, xMin, xMax, xTicks
      yLabel, yUnits, yMin, yMax, yTicks } = pane

    xUnitsRef = runtimeActivity.getUnitRef dumbSingularize xUnits
    yUnitsRef = runtimeActivity.getUnitRef dumbSingularize yUnits

    xAxis = runtimeActivity.createAndAppendAxis { label: xLabel, unitRef: xUnitsRef, min: xMin, max: xMax, nSteps: xTicks }
    yAxis = runtimeActivity.createAndAppendAxis { label: yLabel, unitRef: yUnitsRef, min: yMin, max: yMax, nSteps: yTicks }

    step.addGraphPane { title, xAxis, yAxis }
