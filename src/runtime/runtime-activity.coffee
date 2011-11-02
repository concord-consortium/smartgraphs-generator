###
  Output "Activity" object.

  This class maintains a set of child objects that represent something close to the output "Smartgraphs runtime JSON"
  format and has a toHash method to generate that format. (However, this class will likely maintain model objects that
  aren't explicitly represented in the final output hash or in the Smartgraphs runtime; for example, having an
  runtime/Graph class makes sense, even though the output hash is 'denormalized' and doesn't have an explicit
  representation of a Graph)

  Mostly, this class and the classes of its contained child objects implement builder methods that the author/* objects
  know how to call.
###

{slugify}     = require '../slugify'
{RuntimePage} = require './runtime-page'
{Step}        = require './step'

exports.RuntimeActivity = class RuntimeActivity

  constructor: (@owner, @name) ->
    @pages  = []
    @steps  = []

  getUrl: ->
    "/#{@owner}/#{slugify @name}"

  # metaprogram this factory stuff?
  createPage: (name) ->
    page = new RuntimePage name
    page.activity = this
    page

  createStep: ->
    step = new Step
    step.activity = this
    step

  appendPage: (page) ->
    @pages.push page
    page.index = @pages.length
    page

  toHash: ->
    flatten = (arrays) -> [].concat arrays...     # Handy CS idiom. obj.method args... => obj.method.apply(obj, args);

    _id: 'marias-run-generated-target.df6'  # TODO make this the same as the URL as soon as expected output is updated
    _rev: 1
    data_format_version: 6

    activity:
      title: @name
      url:   @getUrl()
      owner: @owner
      pages: (page.getUrl() for page in @pages)

    pages: page.toHash() for page in @pages
    steps: flatten ((step.toHash() for step in page.steps) for page in @pages)

    responseTemplates: []
    axes:              []
    datadefs:          []
    tags:              []
    annotations:       []
    variables:         []
    units:             []
