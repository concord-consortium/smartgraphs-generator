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
