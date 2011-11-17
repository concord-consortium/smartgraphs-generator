###
  Annotation class and its subclasses
###

AnnotationCollection = exports.AnnotationCollection =

  classFor: {}



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


AnnotationCollection.classFor["HighlightedPoint"] = exports.HighlightedPoint = class HighlightedPoint extends Annotation

  RECORD_TYPE: 'HighlightedPoint'

  constructor: ({ @datadefRef, @tag, @color, @index}) ->
    @name = "highlighted-point-#{@index}"

  toHash: ->
    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.tag         = @tag.getUrl()
    hash.color       = @color

    hash


AnnotationCollection.classFor["SegmentOverlay"] = exports.SegmentOverlay = class SegmentOverlay extends Annotation

  RECORD_TYPE: 'SegmentOverlay'

  constructor: ({ @datadefRef, @color, @xMin, @xMax, @index }) ->
    @name = "segment-overlay-#{@index}"

  toHash: ->

    if @xMin is -Infinity
      x1 = @xMax unless @xMax is Infinity

    if @xMin isnt -Infinity
      x1 = @xMin
      x2 = @xMax unless @xMax is Infinity

    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.color       = @color
    hash.x1Record    = x1
    hash.x2Record    = x2
    hash.isUnboundedLeft  = true if @xMin is -Infinity
    hash.isUnboundedRight = true if @xMax is Infinity

    hash

AnnotationCollection.classFor["CircledPoint"] = exports.CircledPoint = class CircledPoint extends Annotation

  RECORD_TYPE: 'CircledPoint'

  constructor: ({ @datadefRef, @color, @x, @y, @index }) ->
    @name = "circled-point-#{@index}"

  toHash: ->
    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.color       = @color
    hash.xRecord    = @x
    hash.yRecord    = @y

    hash
