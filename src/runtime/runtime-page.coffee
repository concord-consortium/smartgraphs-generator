{slugify} = require '../slugify'

exports.RuntimePage = class RuntimePage

  constructor: (@name) ->
    @steps   = []
    # need to be set
    @index    = null

  setText: (text) ->
    @introText = text

  getUrl: ->
    "#{@activity.getUrl()}/page/#{@index}-#{slugify @name}"

  appendStep: ->
    @steps.push step = @activity.createStep()
    step.page  = this
    step.index = @steps.length
    step

  toHash: ->
    name:      @name
    url:       @getUrl()
    activity:  @activity.getUrl()
    index:     @index
    introText: @introText
    steps:     step.getUrl() for step in @steps
    firstStep: @steps[0]?.getUrl()
