{slugify} = require '../slugify'
{Step}    = require './step'

exports.RuntimePage = class RuntimePage

  constructor: (@name) ->
    @steps   = []
    # need to be set
    @activity = null
    @index    = null

  setText: (text) ->
    @introText = text

  getUrl: ->
    "#{@activity.getUrl()}/page/#{@index}-#{slugify @name}"

  appendStep: ->
    @steps.push step = new Step
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
