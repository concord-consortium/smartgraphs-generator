exports.OutputStep = class OutputStep

  constructor: (@doc, index, @hash) ->
    hash.activityPage = hash.activityPage.url()
    hash.url = "#{hash.activityPage}/step/1"

  url: ->
    @hash.url

  appendPane: (props) ->
    if not @hash.panes
      @hash.panes = 
        single: props
    else
      throw "Multiple panes are not handled yet"

  addTool: (name, options) ->
    # remember that we need a tool stanza in our output hash...
    # which will happen when using @doc.createTool
