{slugify} = require '../slugify'

exports.OutputPage = class OutputPage

  constructor: (@doc, @hash)->
    hash.activity = hash.activity.url()
    hash.steps = []
    hash.url = "#{hash.activity}/page/#{hash.index}-#{slugify hash.name}"

  url: ->
    @hash.url

  appendStep: (props) ->
    props.activityPage = this
    index = @hash.steps.length + 1
    step = @doc.createStep index, props
    @hash.steps.push step.url()
    if(index == 1)
      @hash.firstStep = step.url()
    step