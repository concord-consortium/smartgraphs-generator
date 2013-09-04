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

  constructor: ({@points, @index, @pointType, @lineType, @lineSnapDistance, @xUnits, @yUnits, @name , @color, @derivativeOf, @piecewiseLinear}) ->
    @name ?= "datadef-#{@index}"
    @lineSnapDistance ?= 0

  populateSourceDatasets: ->
    # populateDataSet needs an object, not a name
    if @derivativeOf? then @activity.populateDataSet [{name: @derivativeOf}]

  constructUnitRefs: ->
    @xUnitsRef = @activity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = @activity.getUnitRef dumbSingularize @yUnits if @yUnits

  setColor: (color) ->
    @color = color

  getDerivativeSourceType: (sourceDataName) ->
    # First check for a dataref. Datarefs are associated with a Datadef stored under the same key.
    if @activity.hasDataref sourceDataName
      return 'dataref'
    else if @activity.hasDatadef sourceDataName
      return 'datadef'
    else
      throw new Error "unknown source data: #{sourceDataName}"

  getDerivativeSourceName: (sourceDataName) ->
    sourceType = this.getDerivativeSourceType sourceDataName
    if sourceType is 'datadef' then return sourceDataName

    # But if it's a dataref, look up the name of the dataref itself, rather than the name of the
    # datadef it populates.
    @activity.getDatarefRef(sourceDataName).dataref.name

  getUrl: ->
    "#{@activity.getUrl()}/datadefs/#{@name}"

  toHash: ->
    hash =
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

    if @derivativeOf?
      hash.sourceType = this.getDerivativeSourceType @derivativeOf
      hash.source     = this.getDerivativeSourceName @derivativeOf
      hash.sourceIsPiecewiseLinear = @piecewiseLinear || false

    hash
