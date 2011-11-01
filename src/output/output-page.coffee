{slugify} = require '../slugify'
{Step}    = require './step'

exports.OutputPage = class OutputPage

  constructor: (@inputPage) ->
    {@name}  = @inputPage
    @steps   = []

  setText: (text) ->
    @introText = text

  url: ->
    "#{@activity.url}/page/#{@index}-#{slugify @name}"

  appendStep: ->
    @steps.push step = new Step this, @steps.length + 1    # sense of constructor argument changes to 'parent object' (page) here
    step

  toHash: ->
    name:      @name
    url:       this.url()
    activity:  @activity.url
    index:     @index
    introText: @introText
    steps:     step.url() for step in @steps
    firstStep: @steps[0]?.url()
