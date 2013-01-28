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

  constructor: ({ @datadefRef, @tag, @color, @index, @name}) ->
    @name ?= "highlighted-point-#{@index}"

  toHash: ->
    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.tag         = @tag.getUrl()
    hash.color       = @color

    hash


AnnotationCollection.classFor["RangeVisualPrompt"] = exports.RangeVisualPrompt = class RangeVisualPrompt extends Annotation

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

AnnotationCollection.classFor["PointCircleVisualPrompt"] = exports.PointCircleVisualPrompt = class PointCircleVisualPrompt extends Annotation

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

AnnotationCollection.classFor["PointAxisLineVisualPrompt"] = exports.PointAxisLineVisualPrompt = class PointAxisLineVisualPrompt extends Annotation

  RECORD_TYPE: 'LineToAxis'

  constructor: ({ @datadefRef, @color, @x, @y, @axis, @index }) ->
    @name = "line-to-axis-#{@index}"

  toHash: ->
    hash = super()
    hash.datadefName = @datadefRef.datadef.name
    hash.color       = @color
    hash.xRecord    = @x
    hash.yRecord    = @y
    hash.axis       = @axis

    hash

AnnotationCollection.classFor["FreehandSketch"] = exports.FreehandSketch = class FreehandSketch extends Annotation

  RECORD_TYPE: 'FreehandSketch'

  constructor: ({ @index }) ->
    @name = "freehand-sketch-#{@index}"

  toHash: ->
    hash = super()
    hash.color       = '#CC0000'
    hash.points      = []

    hash

annotations = [

]
class SimpleAnnotation extends Annotation
  RECORD_TYPE: 'SimpleAnnotation'
  namePrefix:  'rise-and-run'
  constructor: ({@index, @datadefRef, @p1Tag, @p2Tag, @color, @name}) ->
    @name ?= "#{@namePrefix}#{@index}"

  toHash: ->
    hash = super()
    hash.color = @color
    hash.datadefName = @datadefRef.datadef.name
    hash.p1Tag = @p1Tag.getUrl()
    hash.p2Tag = @p2Tag.getUrl()
    hash
    
AnnotationCollection.classFor["Label"] = exports.Label = class Label extends Annotation
  RECORD_TYPE: 'Label'
  constructor: ({@index, @point, @text, @name, @namePrefix}) ->
    @namePrefix ?=  'label'
    @name ?= "#{@namePrefix}-#{@index}"
    @offset ?= [ undefined, undefined ]
    @point ?= [ undefined, undefined ]
  toHash: ->
    hash = super()
    hash.text = @text
    hash.x = @point[0]
    hash.y = @point[1]
    hash.xOffset = @offset[0]
    hash.yOffset = @offset[1]
    hash
  
AnnotationCollection.classFor["LabelSet"] = exports.LabelSet = class LabelSet extends Annotation
  RECORD_TYPE: 'LabelSet'
  namePrefix:  'labelSet'
  constructor: ({@index, @labels, @name}) ->
    @name ?= "#{@namePrefix}-#{@index}"
  toHash: ->
    hash = super()
    hash.labels = @labels
    hash

AnnotationCollection.classFor["RunArrow"] = exports.RunArrow = class RunArrow extends SimpleAnnotation
  RECORD_TYPE: 'RunArrow'
  namePrefix:  'run-arrow'

AnnotationCollection.classFor["RiseArrow"] = exports.RiseArrow = class RiseArrow extends SimpleAnnotation
  RECORD_TYPE: 'RiseArrow'
  namePrefix:  'rise-arrow'

AnnotationCollection.classFor["RunBracket"] = exports.RunBracket = class RunBracket extends SimpleAnnotation
  RECORD_TYPE: 'RunBracket'
  namePrefix:  'run-bracket'

AnnotationCollection.classFor["RiseBracket"] = exports.RiseBracket = class RiseBracket extends SimpleAnnotation
  RECORD_TYPE: 'RiseBracket'
  namePrefix:  'rise-bracket'

AnnotationCollection.classFor["LineThroughPoints"] = exports.LineThroughPoints = class LineThroughPoints extends SimpleAnnotation
  RECORD_TYPE: 'LineThroughPoints'
  namePrefix:  'line-throughpoints'
  
