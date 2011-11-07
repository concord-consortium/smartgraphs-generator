{slugify} = require '../slugify'

exports.RuntimePage = class RuntimePage

  constructor: () ->
    @steps   = []
    # need to be set
    @index    = null

  setText: (@introText) ->
    @introText

  setName: (@name) ->
    @name

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@activity.getUrl()}/page/#{@index}-#{slugify @name}"

  appendStep: (sequence) ->
    @steps.push step = @activity.createStep(sequence)
    step.page  = this
    step.setIndex @steps.length
    step

  toHash: ->
    name:      @name
    url:       @getUrl()
    activity:  @activity.getUrl()
    index:     @index
    introText: @introText
    steps:     step.getUrl() for step in @steps
    firstStep: @steps[0]?.getUrl()
