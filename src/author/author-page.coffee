{RuntimePage} = require '../runtime/runtime-page'

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
        when 'GraphPane' then @addGraphPane step, pane
      else throw new Error "Only ImagePanes and GraphPanes are supported right now"

    runtimePage

  addImagePane: (step, pane) ->
    {url, license, attribution} = pane
    step.addImagePane url, license, attribution

  addGraphPane: (step, pane) ->
    null
