###
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
###

exports.Datadef = class Datadef

  # a "class method"
  @serializeDatadefs = (datadefs) ->
    if datadefs.length == 0 then [] else [{ type: 'UnorderedDataPoints', records: (datadef.toHash() for datadef in datadefs) }]

  constructor: ({@points, @xLabel, @xUnitsRef, @yLabel, @yUnitsRef, @index, @pointType, @lineType, @lineSnapDistance, @name }) ->
    if !_arg.name then @name = "datadef-#{@index}"
    if !_arg.lineSnapDistance then @lineSnapDistance = 0

  getUrl: ->
    "#{@activity.getUrl()}/datadefs/#{@name}"

  toHash: ->
    url:               @getUrl()
    name:              @name
    activity:          @activity.getUrl()
    xUnits:            @xUnitsRef?.unit.getUrl()
    xLabel:            @xLabel
    xShortLabel:       @xLabel
    yUnits:            @yUnitsRef?.unit.getUrl()
    yLabel:            @yLabel
    yShortLabel:       @yLabel
    points:            @points
    pointType:         @pointType
    lineType:          @lineType
    lineSnapDistance:  @lineSnapDistance
