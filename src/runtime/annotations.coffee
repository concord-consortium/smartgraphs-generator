###
  Annotation class and its subclasses
###

exports.Annotation = class Annotation

  @serializeAnnotations = (allAnnotations) ->
    ret = []
    for key, annotationsOfOneType of allAnnotations
      ret.push
        type:    annotationsOfOneType[0].RECORD_TYPE     # Closure Compiler -> don't trust 'key' not to be minimized/obfuscated
        records: (annotation.toHash() for annotation in annotationsOfOneType)

    ret

  getUrl: ->
    "#{@activity.getUrl()}/annotations/#{@name}"

  toHash: ->
    url:         @getUrl()
    name:        @name
    activity:    @activity.getUrl()


exports.HighlightedPoint = class HighlightedPoint extends Annotation

  RECORD_TYPE: 'HighlightedPoint'

  constructor: ({ @datadefRef, @tag, @color, @index}) ->
    @name = "highlighted-point-#{@index}"

  toHash: ->
    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.tag         = @tag.getUrl()
    hash.color       = @color

    hash


exports.SegmentOverlay = class SegmentOverlay extends Annotation

  RECORD_TYPE: 'SegmentOverlay'

  constructor: ({ @datadefRef, @color, @xMin, @xMax, @index }) ->
    @name = "segment-overlay-#{@index}"

  toHash: ->

    x1 = x2 = isUnboundedLeft = isUnboundedRight = undefined

    if @xMin is -Infinity
      isUnboundedLeft = true
      if @xMax is Infinity
        isUnboundedRight = true
      else
        x1 = @xMax
    else
      x1 = @xMin
      if @xMax is Infinity
        isUnboundedRight = true
      else
        x2 = @xMax

    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.color       = @color
    hash.x1Record    = x1
    hash.x2Record    = x2
    hash.isUnboundedLeft  = isUnboundedLeft
    hash.isUnboundedRight = isUnboundedRight

    hash