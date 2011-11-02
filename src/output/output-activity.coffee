###
  Output "Activity" object.

  This class knows how to construct a itself from an InputActivity object. It maintains a set of child objects that
  represent something close to the output "Smartgraphs runtime JSON" format and has a toHash method to generate that
  format. (However, this class will likely maintain model objects that aren't explicitly represented in the final
  output hash or in the Smartgraphs runtime; for example, having an output.Graph class makes sense, even though the
  output hash is 'denormalized' and doesn't have an explicit representation of a Graph)

  Mostly, this class and the classes of its contained child objects implement builder methods that the input.* objects
  know how to call.
###

{slugify}    = require '../slugify'
{OutputPage} = require './output-page'

exports.OutputActivity = class OutputActivity

  constructor: (@inputActivity) ->
    {@owner, @name} = @inputActivity
    @url    = "/#{@owner}/#{slugify @name}"
    @pages  = []
    @steps  = []

  appendPage: (outputPage) ->
    @pages.push outputPage
    outputPage.activity = this
    outputPage.index    = @pages.length
    outputPage

  toHash: ->
    flatten = (arrays) -> [].concat arrays...     # Handy CS idiom. obj.method args... => obj.method.apply(obj, args);

    _id: 'marias-run-generated-target.df6'  # TODO make this the same as the URL as soon as expected output is updated
    _rev: 1
    data_format_version: 6

    activity:
      title: @name
      url:   @url
      owner: @owner
      pages: (page.url() for page in @pages)

    pages: page.toHash() for page in @pages
    steps: flatten ((step.toHash() for step in page.steps) for page in @pages)

    responseTemplates: []
    axes:              []
    datadefs:          []
    tags:              []
    annotations:       []
    variables:         []
    units:             []
