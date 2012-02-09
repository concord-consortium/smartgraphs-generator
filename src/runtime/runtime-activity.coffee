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
{Datadef}     = require './datadef'
{Tag}         = require './tag'

{AnnotationCollection, Annotation, HighlightedPoint, SegmentOverlay} = require './annotations'
{ResponseTemplateCollection} = require './response-templates'

exports.RuntimeActivity = class RuntimeActivity

  constructor: (@owner, @name) ->
    @pages     = []
    @steps     = []
    @unitRefs  = {}

    @axes      = {}
    @nAxes     = 0

    @datadefRefs = {}
    @nDatadefs   = 0

    @annotations  = {}
    @annotationCounts = {}      # {"HighlightedPoints": 3, "SegmentOverlays": 6}

    @tags      = []
    @nTags     = 0

    @responseTemplates = {}
    @responseTemplatesCounts = {}


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

  createDatadef: ({ points, xLabel, xUnitsRef, yLabel, yUnitsRef }) ->
    datadef = new Datadef { points, xLabel, xUnitsRef, yLabel, yUnitsRef, index: ++@nDatadefs }
    datadef.activity = this
    datadef

  ###
    Forward references. Some of this is repetitious and should be factored out.
  ###
  getUnitRef: (key) ->
    if ref = @unitRefs[key] then return ref
    else ref = @unitRefs[key] = { key, unit: null }
    ref

  defineUnit: (key, unit) ->
    ref = @getUnitRef key
    if ref.unit? then throw new Error "Redefinition of unit #{key}"
    ref.unit = unit
    unit

  getDatadefRef: (key) ->
    if ref = @datadefRefs[key] then return ref
    else ref = @datadefRefs[key] = { key, datadef: null }
    ref

  defineDatadef: (key, datadef) ->
    ref = @getDatadefRef key
    if ref.datadef? then throw new Error "Redefinition of datadef #{key}"
    ref.datadef = datadef
    datadef

  ###
    Things that are defined only inline (for now) and therefore don't need to be treated as forward references.
  ###
  createAndAppendAxis: ({label, unitRef, min, max, nSteps}) ->
    axis = new Axis { label, unitRef, min, max, nSteps, index: ++@nAxes }
    axis.activity = this
    @axes[axis.getUrl()] = axis
    axis

  createAndAppendTag: ->
    tag = new Tag { index: ++@nTags }
    tag.activity = this
    @tags.push tag
    tag

  createAndAppendAnnotation: (hash) ->
    {type} = hash
    annotationClass = AnnotationCollection.classFor[type]
    @annotationCounts[type] ?= 0
    hash.index = ++@annotationCounts[type]
    annotation = new annotationClass hash
    annotation.activity = this
    @annotations[type] ?= []
    @annotations[type].push annotation
    annotation

  createAndAppendResponseTemplate: (type, initialValues = [""]) ->
    templateClass = ResponseTemplateCollection.classFor[type]
    return @responseTemplates[[type, initialValues]] unless !@responseTemplates[[type, initialValues]]

    @responseTemplatesCounts[type] ?= 0
    count = ++@responseTemplatesCounts[type]

    responseTemplate = new templateClass count, initialValues
    responseTemplate.activity = this
    @responseTemplates[[type, initialValues]] = responseTemplate
    responseTemplate

  appendPage: (page) ->
    @pages.push page
    page.setIndex @pages.length
    page

  toHash: ->
    flatten = (arrays) -> [].concat arrays...     # Handy CS idiom. obj.method args... => obj.method.apply(obj, args);

    _id: "#{slugify @name}.df6"
    _rev: 1
    data_format_version: 6

    activity:
      title: @name
      url:   @getUrl()
      owner: @owner
      pages: (page.getUrl() for page in @pages)
      axes:  url for url of @axes

    pages: page.toHash() for page in @pages
    steps: flatten ((step.toHash() for step in page.steps) for page in @pages)

    responseTemplates: template.toHash() for own i, template of @responseTemplates
    axes:              @axes[url].toHash() for url of @axes
    datadefs:          Datadef.serializeDatadefs(@datadefRefs[key].datadef for key of @datadefRefs)
    tags:              tag.toHash() for tag in @tags
    annotations:       Annotation.serializeAnnotations @annotations
    variables:         []
    units:             @unitRefs[key].unit.toHash() for key of @unitRefs
