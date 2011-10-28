exports.Page = class Page

  constructor: (@hash, @activity) ->
    # (process hash...)
    @outputActivity = @activity.outputActivity
    return

  # create an output.Page object and modify it appropriately
  process: ->
    @outputPage = @outputActivity.appendPage(this)

