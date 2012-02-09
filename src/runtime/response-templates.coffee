ResponseTemplateCollection = exports.ResponseTemplateCollection =

  classFor: {}


class ResponseTemplate

  getUrl: ->
    "#{@activity.getUrl()}/response-templates/#{@name}-#{@number}"

  toHash: ->
    url:         @getUrl()
    templateString: ""
    fieldChoicesList: [null]
    initialValues: @initialValues
    fieldTypes: @fieldTypes


ResponseTemplateCollection.classFor['NumericResponseTemplate'] =  class NumericResponseTemplate extends ResponseTemplate

  constructor: (@number, @initialValues = [""]) ->
    super()
    @name = "numeric"
    @fieldTypes = ("numeric" for val in @initialValues)

ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] =  class NumericResponseTemplate extends ResponseTemplate

  constructor: (@number, @initialValues = [""]) ->
    super()
    @name = "open"
    @fieldTypes = ("textarea" for val in @initialValues)

