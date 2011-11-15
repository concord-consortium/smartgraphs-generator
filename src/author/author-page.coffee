{Sequence}   = require './sequences'
{AuthorPane} = require './author-panes'

exports.AuthorPage = class AuthorPage

  constructor: (@hash, @activity, @index) ->
    {@name, @text} = @hash

    if @hash.panes?.length > 2
      throw new Error "There cannot be more than two panes"

    @panes = if @hash.panes? then (AuthorPane.fromHash h for h in @hash.panes) else []
    [pane.page, pane.index] = [this, index] for pane, index in @panes

    sequence = @hash.sequence ? {}
    sequence.page = this
    @sequence = Sequence.fromHash sequence

  toRuntimePage: (runtimeActivity) ->
    runtimePage = runtimeActivity.createPage()

    runtimePage.setName @name
    runtimePage.setText @text

    pane.addToPageAndActivity(runtimePage, runtimeActivity) for pane in @panes

    @sequence.appendSteps runtimePage

    runtimePage
