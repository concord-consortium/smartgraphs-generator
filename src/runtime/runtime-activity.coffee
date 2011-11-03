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
{Axis}        = require './axis'
{RuntimeUnit} = require './runtime-unit'

exports.RuntimeActivity = class RuntimeActivity

  constructor: (@owner, @name) ->
    @pages    = []
    @steps    = []
    @unitRefs = {}
    @axes     = {}

  getUrl: ->
    "/#{@owner}/#{slugify @name}"

  ###
    Factories for stuff we own. Could be metaprogrammed.
  ###
  createPage: ->
    page = new RuntimePage
    page.activity = this
    page

  createStep: ->
    step = new Step
    step.activity = this
    step

  createUnit: ->
    unit = new RuntimeUnit
    unit.activity = this
    unit

  ###
    Forward references. (Things that may be used in one place but defined elsewhere.)
  ###

  getUnitRef: (name) ->
    if ref = @unitRefs[name] then return ref
    else ref = @unitRefs[name] = { name, unit: null }
    ref

  defineUnit: (unit) ->
    ref = @getUnitRef unit.name
    if ref.unit? then throw new Error "Warning: redefining unit #{ref.name}"
    ref.unit = unit
    unit

  ###
    Axis is an oddball for the time being. It's defined when used, but later we'll want to reuse axes
  ###
  createAndAppendAxis: ({label, unitRef, min, max, nSteps}) ->
    axis = new Axis {label, unitRef, min, max, nSteps}
    axis.activity = this
    @axes[axis.getUrl()] = axis
    axis

  appendPage: (page) ->
    @pages.push page
    page.setIndex @pages.length
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
    axes:              @axes[url].toHash() for url of @axes
    datadefs:          []
    tags:              []
    annotations:       []
    variables:         []
    units:             @unitRefs[name].unit.toHash() for name of @unitRefs
