{RuntimePage} = require '../runtime/runtime-page'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text, @panes} = @hash

  toRuntimePage: ->
    ret = new RuntimePage @name
    ret.setText @text     # RuntimePage shouldn't have to know OUR property name for the text
                          # (remember the RuntimePage model should be fairly stable, the *input* models will change)

    # TODO we'll want to move this logic elsewhere
    step = ret.appendStep()

    if @panes?.length > 0
      if @panes.length > 1 then throw new Error "Only one pane is supported right now"
      pane = @panes[0]
      {type, url, license, attribution} = pane
      if type != 'ImagePane' then throw new Error "Only ImagePanes are supported right now"
      step.addImagePane url, license, attribution

    ret
