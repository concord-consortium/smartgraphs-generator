{dumbSingularize} = require '../singularize'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text, @panes} = @hash
    @datadefRef = null

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
          when 'ImagePane'           then @addImagePane step, pane, i
          when 'PredefinedGraphPane' then @addPredefinedGraphPane step, pane, runtimeActivity, i
          when 'TablePane'           then @addTablePane step, pane, runtimeActivity, i
          else throw new Error "Only ImagePanes, PredefinedGraphPanes and TablePanes are supported right now"

    runtimePage

  addImagePane: (step, pane, index) ->
    {url, license, attribution} = pane
    step.addImagePane { url, license, attribution, index }

  addPredefinedGraphPane: (step, pane, runtimeActivity, index) ->
    { title,
      data,
      xLabel, xUnits, xMin, xMax, xTicks
      yLabel, yUnits, yMin, yMax, yTicks } = pane

    xUnitsRef = runtimeActivity.getUnitRef dumbSingularize xUnits unless !xUnits
    yUnitsRef = runtimeActivity.getUnitRef dumbSingularize yUnits unless !yUnits

    xAxis = runtimeActivity.createAndAppendAxis { label: xLabel, unitRef: xUnitsRef, min: xMin, max: xMax, nSteps: xTicks }
    yAxis = runtimeActivity.createAndAppendAxis { label: yLabel, unitRef: yUnitsRef, min: yMin, max: yMax, nSteps: yTicks }

    if data?
      @datadefRef ?= runtimeActivity.getDatadefRef @name     # @name is the page name -- just a unique key for stashing this reference
      datadef = runtimeActivity.createDatadef { points: data, xLabel, xUnitsRef, yLabel, yUnitsRef }
      runtimeActivity.defineDatadef @name, datadef

    step.addGraphPane { title, @datadefRef, xAxis, yAxis, index }

  addTablePane: (step, pane, runtimeActivity, index) ->
    @datadefRef ?= runtimeActivity.getDatadefRef @name      # @name is the page name
    step.addTablePane { @datadefRef, index }
