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
      {type, url, license, attribution} = pane
      if type != 'ImagePane' then throw new Error "Only ImagePanes are supported right now"
      step.addImagePane url, license, attribution

    runtimePage
