{slugify} = require '../slugify'
{Step}    = require './step'

exports.OutputPage = class OutputPage

  constructor: (@name) ->
    @steps   = []
    # need to be set
    @activity = null
    @index    = null

  setText: (text) ->
    @introText = text

  url: ->
    "#{@activity.url()}/page/#{@index}-#{slugify @name}"

  appendStep: ->
    @steps.push step = new Step
    step.page  = this
    step.index = @steps.length
    step

  toHash: ->
    name:      @name
    url:       this.url()
    activity:  @activity.url()
    index:     @index
    introText: @introText
    steps:     step.url() for step in @steps
    firstStep: @steps[0]?.url()
