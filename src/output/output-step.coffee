exports.OutputStep = class OutputStep

  constructor: (@doc, index, @hash) ->
    hash.activityPage = hash.activityPage.url()
    hash.url = "#{hash.activityPage}/step/1"

  url: ->
    @hash.url

  addTool: (name, options) ->
    # remember that we need a tool stanza in our output hash...
    # which will happen when using @doc.createTool
