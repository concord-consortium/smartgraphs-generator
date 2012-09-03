exports.DataRef = class DataRef

  @serializeDataRefs = (dataRefRefs) ->
    ret = []
    for key, dataRefOfOneType of dataRefRefs
      ret.push
        type:    dataRefOfOneType[0].expressionType
        records: (dataRef.toHash() for dataRef in dataRefOfOneType)
    ret

  constructor: ({ @datadefname, @expressionType, @expressionForm, @angularFunction, @xInterval, @params, @index }) ->
    @name = "dataref-#{@index}"

  getUrl: ->
    "#{@activity.getUrl()}/datarefs/#{@name}"

  toHash: ->
    url:             @getUrl()
    name:            @name
    activity:        @activity.getUrl()
    datadefName:     @datadefname
    expressionForm:  @expressionForm
    angularFunction: @angularFunction
    xInterval:       @xInterval
    params:          @params
