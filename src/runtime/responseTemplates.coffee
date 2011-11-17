ResponseTemplateCollection = exports.ResponseTemplateCollection =

  classFor: {}


class ResponseTemplate

  getUrl: ->
    "#{@activity.getUrl()}/response-templates/#{@name}"

  toHash: ->
    url:         @getUrl()


ResponseTemplateCollection.classFor['NumericResponseTemplate'] =  class NumericResponseTemplate extends ResponseTemplate

  constructor: (@initialValues = [""]) ->
    @name = "numeric"

  toHash: ->
    hash = super()
    hash.templateString = ""
    hash.fieldTypes = ["numeric"]
    hash.fieldChoicesList = [null]
    hash.initialValues = @initialValues

    hash

ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] =  class NumericResponseTemplate extends ResponseTemplate

  constructor: (@initialValues = [""]) ->
    @name = "open"

  toHash: ->
    hash = super()
    hash.templateString = ""
    hash.fieldTypes = ["textarea"]
    hash.fieldChoicesList = [null]
    hash.initialValues = @initialValues

    hash
