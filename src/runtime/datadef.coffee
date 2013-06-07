###
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
###

{dumbSingularize} = require '../singularize'

exports.Datadef = class Datadef

  # a "class method"
  @serializeDatadefs = (datadefs) ->
    udps = []
    derivatives = []
    ret = []

    # Duck type the two record types. UnorderedDataPointses have no 'derivativeOf' field
    for datadef in datadefs
      if datadef.derivativeOf?
        derivatives.push datadef
      else
        udps.push datadef

    if udps.length > 0
      ret.push
        type: 'UnorderedDataPoints'
        records: (udp.toHash() for udp in udps)

    if derivatives.length > 0
      ret.push
        type: 'FirstDerivative'
        records: (derivative.toHash() for derivative in derivatives)

    ret

  constructor: ({@points, @index, @pointType, @lineType, @lineSnapDistance, @xUnits, @yUnits, @name , @color, @derivativeOf}) ->
    @name ?= "datadef-#{@index}"
    @lineSnapDistance ?= 0

  populateSourceDatasets: ->
    if @derivativeOf? then @activity.populateDataSet [@derivativeOf]

  constructUnitRefs: ->
    @xUnitsRef = @activity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = @activity.getUnitRef dumbSingularize @yUnits if @yUnits

  setColor: (color) ->
    @color = color

  getDatarefUrl: (sourceDataName) ->
    @activity.getDatarefRef(sourceDataName).dataref.getUrl()

  getUrl: ->
    "#{@activity.getUrl()}/datadefs/#{@name}"

  toHash: ->
    url:               @getUrl()
    name:              @name
    activity:          @activity.getUrl()
    xUnits:            @xUnitsRef?.unit.getUrl()
    yUnits:            @yUnitsRef?.unit.getUrl()
    points:            @points
    pointType:         @pointType
    lineType:          @lineType
    lineSnapDistance:  @lineSnapDistance
    color:             @color
    source:            if @derivativeOf? then @getDatarefUrl(@derivativeOf) else undefined
