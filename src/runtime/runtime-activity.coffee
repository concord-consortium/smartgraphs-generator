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
{DataRef}     = require './dataref'
{Tag}         = require './tag'
{expressionParser} = require '../author/expressionParser'

{AnnotationCollection, Annotation, HighlightedPoint, SegmentOverlay} = require './annotations'
{ResponseTemplateCollection} = require './response-templates'

exports.RuntimeActivity = class RuntimeActivity

  constructor: (@owner, @name, @authorName, @ccProjectName, @datasets, @labelSets) ->
    @pages     = []
    @steps     = []
    @unitRefs  = {}

    @axes      = {}
    @nAxes     = 0

    @datadefRefs = {}
    @nDatadefs   = 0

    @datarefRefs = {}
    @nDatarefs  = 0

    @annotations  = {}
    @annotationCounts = {}      # {"HighlightedPoints": 3, "SegmentOverlays": 6}

    @tags      = []
    @nTags     = 0

    @responseTemplates = {}
    @responseTemplatesCounts = {}

    @referenceDatadef

    @dataSetColors = [ "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf" ]
    @colorIndex = @dataSetColors.length - 1


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

  createDatadef: (hash) ->
    hash.index = ++@nDatadefs
    datadef = new Datadef hash
    datadef.activity = this
    datadef.populateSourceDatasets()
    datadef.constructUnitRefs()
    datadef

  createDataref: ({ datadefName, expressionType, expressionForm, expression, angularFunction, xInterval, params, index, lineSnapDistance, name }) ->
    dataref = new DataRef { datadefName, expressionType, expressionForm, expression, angularFunction, xInterval, params, index: ++@nDatarefs, lineSnapDistance, name }
    dataref.activity = this
    dataref

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

  hasDatadef: (key) ->
    @datadefRefs[key]?

  getDatarefRef: (key) ->
    if ref = @datarefRefs[key] then return ref
    else ref = @datarefRefs[key] = { key, dataref: null }
    ref

  hasDataref: (key) ->
    @datarefRefs[key]?

  defineDatadef: (key, hash) ->
    ref = @getDatadefRef key
    ref.datadef = this.createDatadef(hash) unless ref.datadef?
    ref.datadef

  defineDataref: (key, hash) ->
    ref = @getDatarefRef key
    ref.dataref = this.createDataref(hash) unless ref.dataref?
    ref.dataref

  # Called when a graph or table pane having includedDataSets is added to the (runtime) activity
  # returns a list of datadefs and datarefs corresponding to the dataset names in includedDataSets

  populateDataSet: (includedDataSets) ->
    # includedDataSets needs to be an object with a name property - not a string
    populatedDataDefs = []
    populatedDataRefs = []
    activeDataSetIndex = 0
    for datasetEntry in includedDataSets
      for datasetObject in @datasets
        if datasetObject.name is datasetEntry.name
          if String(datasetObject.type).toLowerCase() is "datadef"
            datadef = @getDatadefRef(datasetObject.name).datadef
            if not datadef?
              datadef = this.defineDatadef(datasetObject.name, { points: datasetObject.data, xUnits: datasetObject.xUnits, yUnits: datasetObject.yUnits, lineType: datasetObject.lineType, pointType: datasetObject.pointType, lineSnapDistance: datasetObject.lineSnapDistance, name: datasetObject.name, derivativeOf: datasetObject.derivativeOf, piecewiseLinear: datasetObject.piecewiseLinear })
            populatedDataDefs.push datadef

          else if String(datasetObject.type).toLowerCase() is "dataref"
            @expression = datasetObject.expression
            if @expression isnt null and @expression isnt undefined
              expressionData = expressionParser.parseExpression(@expression)
              if expressionData.type? and expressionData.type isnt "not supported"
                datadef = @getDatadefRef(datasetObject.name).datadef
                if datadef?
                  dataref = this.getDatarefRef(datasetObject.name).dataref
                else
                  datadef = this.defineDatadef(datasetObject.name, { points: [], xUnits: datasetObject.xUnits, yUnits: datasetObject.yUnits,  lineType: datasetObject.lineType, lineSnapDistance: datasetObject.lineSnapDistance, pointType: datasetObject.pointType, name: datasetObject.name })
                  dataref = this.defineDataref(datasetObject.name, { datadefName: datadef.name, expressionType: expressionData.type, xInterval: datasetObject.xPrecision, expressionForm: expressionData.form, expression: datasetObject.expression, angularFunction: expressionData.angularFunction, params: expressionData.params, lineSnapDistance: datasetObject.lineSnapDistance })

                populatedDataDefs.push datadef
                populatedDataRefs.push dataref

    @referenceDatadef = datadef
    { datadefs: populatedDataDefs, datarefs: populatedDataRefs }

  createNewEmptyDataRef: (name, expression, xPrecision, lineSnapDistance, color) ->
    if expression isnt null and expression isnt undefined
      expressionData = expressionParser.parseExpression(expression)
      if expressionData.type? and expressionData.type isnt "not supported"
        unless datadef = @getDatadefRef(name).datadef
          datadef = this.defineDatadef(name, { points: [], xUnits: @referenceDatadef.xUnits, yUnits: @referenceDatadef.yUnits, lineType: 'connected', pointType: 'none', lineSnapDistance: @referenceDatadef.lineSnapDistance, name: name, color: color})
          dataref = this.defineDataref(name, { datadefName: datadef.name, expressionType: expressionData.type, xInterval: xPrecision, expressionForm: expressionData.form, expression: expression, angularFunction: expressionData.angularFunction, params: expressionData.params, lineSnapDistance: lineSnapDistance })
        else
          dataref = this.getDatarefRef(datasetObject.name).dataref

        { datadef: datadef, dataref: dataref }

  getNewColor: ->
    unless @colorIndex <= 0 then @dataSetColors[@colorIndex--] else throw new Error "No new color available."


  setColorOfDatadef: (datadefName, color) ->
    if datadef = @getDatadefRef(datadefName).datadef
      datadef.setColor color

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
    if @annotations[type]
      for createdAnnotation in @annotations[type]
        if createdAnnotation.name is hash.name
          return createdAnnotation
    AnnotationClass = AnnotationCollection.classFor[type]
    @annotationCounts[type] ?= 0
    hash.index = ++@annotationCounts[type]
    annotation = new AnnotationClass hash
    annotation.activity = this
    @annotations[type] ?= []
    @annotations[type].push annotation
    annotation

  createAndAppendResponseTemplate: (type, initialValues = [""], choices) ->
    TemplateClass = ResponseTemplateCollection.classFor[type]

    key = TemplateClass.getUniqueKey initialValues, choices
    if @responseTemplates[key] then return @responseTemplates[key]

    @responseTemplatesCounts[type] ?= 0
    count = ++@responseTemplatesCounts[type]

    @responseTemplates[key] = responseTemplate = new TemplateClass count, initialValues, choices
    responseTemplate.activity = this
    responseTemplate

  appendPage: (page) ->
    @pages.push page
    page.setIndex @pages.length
    page

  activityHash: ->
    result = 
      title: @name
      url:   @getUrl()
      owner: @owner
      pages: (page.getUrl() for page in @pages)
      axes:  url for url of @axes
      authorName: @authorName
    if @ccProjectName
      result['ccProjectName'] = @ccProjectName
    result

  toHash: ->
    flatten = (arrays) -> [].concat arrays...     # Handy CS idiom. obj.method args... => obj.method.apply(obj, args)

    _id: "#{slugify @name}.df6"
    _rev: 1
    data_format_version: 6

    activity: @activityHash()

    pages: page.toHash() for page in @pages
    steps: flatten ((step.toHash() for step in page.steps) for page in @pages)

    responseTemplates: template.toHash() for own i, template of @responseTemplates
    axes:              @axes[url].toHash() for url of @axes
    datadefs:          Datadef.serializeDatadefs(@datadefRefs[key].datadef for key of @datadefRefs)
    datarefs:          if @nDatarefs isnt 0 then DataRef.serializeDataRefs @datarefRefs else undefined
    tags:              tag.toHash() for tag in @tags
    annotations:       Annotation.serializeAnnotations @annotations
    variables:         []
    units:             @unitRefs[key].unit.toHash() for key of @unitRefs
