exports.DataRef = class DataRef

  @serializeDataRefs = (datarefRefs) ->
    ret = []
    datarefsByType = {}

    for key, datarefRef of datarefRefs
      dataref = datarefRef.dataref
      type = dataref.expressionType
      datarefsByType[type] ||= []
      datarefsByType[type].push dataref

    for type, datarefsOfOneType of datarefsByType
      ret.push
        type: type
        records: (dataref.toHash() for dataref in datarefsOfOneType)

    ret

  constructor: ({ @datadefName, @expressionType, @expression, @expressionForm, @angularFunction, @xInterval, @params, @index, @name }) ->
    if !_arg.name then @name = "dataref-#{@index}"

  getUrl: ->
    "#{@activity.getUrl()}/datarefs/#{@name}"

  toHash: ->
    url:             @getUrl()
    name:            @name
    activity:        @activity.getUrl()
    datadefName:     @datadefName
    expressionForm:  @expressionForm
    expression:      if @expressionType is 'CompositeEquation' then @expression else undefined
    angularFunction: @angularFunction
    xInterval:       @xInterval
    params:          @params
