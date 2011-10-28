exports.Page = class Page

  constructor: (@hash, @activity) ->
    # (process hash...)
    @outputActivity = @activity.outputActivity

  # create an output.Page object and modify it appropriately
  convert: ->
    @outputPage = @outputActivity.appendPage(this)
