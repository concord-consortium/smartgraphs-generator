exports.Page = class Page

  constructor: (@hash, @activity) ->
    # TODO process @hash here

  # create an output.Page object and modify it appropriately
  convert: ->
    @outputPage = @outputActivity.appendPage(this)
