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
      if @panes.length > 2 then throw new Error "There cannot be more than two panes"
      for pane, i in @panes
        type = pane.type

        switch type
          when 'ImagePane' then @addImagePane step, pane, @panes.length, i
          when 'PredefinedGraphPane' then @addPredefinedGraphPane step, pane, runtimeActivity, @panes.length, i
          else throw new Error "Only ImagePanes and PredefinedGraphPane are supported right now"

    runtimePage

  addImagePane: (step, pane, numPanes, index) ->
    {url, license, attribution} = pane
    step.addImagePane url, license, attribution, numPanes, index

  addPredefinedGraphPane: (step, pane, runtimeActivity, numPanes, index) ->
    { title,
      data,
      xLabel, xUnits, xMin, xMax, xTicks
      yLabel, yUnits, yMin, yMax, yTicks } = pane

    xUnitsRef = runtimeActivity.getUnitRef dumbSingularize xUnits
    yUnitsRef = runtimeActivity.getUnitRef dumbSingularize yUnits

    xAxis = runtimeActivity.createAndAppendAxis { label: xLabel, unitRef: xUnitsRef, min: xMin, max: xMax, nSteps: xTicks }
    yAxis = runtimeActivity.createAndAppendAxis { label: yLabel, unitRef: yUnitsRef, min: yMin, max: yMax, nSteps: yTicks }

    if data?
      datadef = runtimeActivity.createAndAppendDatadef { points: data, xLabel, xUnitsRef, yLabel, yUnitsRef }

    step.addGraphPane { title, datadef, xAxis, yAxis, numPanes, index }
