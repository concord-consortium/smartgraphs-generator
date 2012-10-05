exports.DataRef = class DataRef

  @serializeDataRefs = (dataRefRefs) ->
    ret = []
    for key, dataRefOfOneType of dataRefRefs
      ret.push
        type:    dataRefOfOneType[0].expressionType
        records: (dataRef.toHash() for dataRef in dataRefOfOneType)
    ret

  constructor: ({ @datadefname, @expressionType, @expression, @expressionForm, @angularFunction, @xInterval, @params, @index, @name }) ->
    if !_arg.name then @name = "dataref-#{@index}"

  getUrl: ->
    "#{@activity.getUrl()}/datarefs/#{@name}"

  toHash: ->
    url:             @getUrl()
    name:            @name
    activity:        @activity.getUrl()
    datadefName:     @datadefname
    expressionForm:  @expressionForm
    expression:      if @expressionType is 'CompositeEquation' then @expression else undefined
    angularFunction: @angularFunction
    xInterval:       @xInterval
    params:          @params
