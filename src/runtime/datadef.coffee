###
  Currently this is a synonym for 'UnorderedDataPoints'. However, we will eventually have to handle
  FirstOrderDifference and Function Datadefs
###

{dumbSingularize} = require '../singularize'

exports.Datadef = class Datadef

  # a "class method"
  @serializeDatadefs = (datadefs) ->
    if datadefs.length == 0 then [] else [{ type: 'UnorderedDataPoints', records: (datadef.toHash() for datadef in datadefs) }]

  constructor: ({@points, @xLabel, @yLabel, @index, @pointType, @lineType, @lineSnapDistance, @xUnits, @yUnits, @name , @color}) ->
    if !_arg.name then @name = "datadef-#{@index}"
    if !_arg.lineSnapDistance then @lineSnapDistance = 0

  constructUnitRefs: ->
    @xUnitsRef = @activity.getUnitRef dumbSingularize @xUnits if @xUnits
    @yUnitsRef = @activity.getUnitRef dumbSingularize @yUnits if @yUnits

  setColor: (color) ->
    @color = color

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
