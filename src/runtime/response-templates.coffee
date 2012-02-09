ResponseTemplateCollection = exports.ResponseTemplateCollection =

  classFor: {}


class ResponseTemplate

  getUrl: ->
    "#{@activity.getUrl()}/response-templates/#{@name}-#{@number}"

  toHash: ->
    url:              @getUrl()
    templateString:   ""
    fieldChoicesList: [@choices ? null]
    initialValues:    @initialValues ? ['']
    fieldTypes:       @fieldTypes


ResponseTemplateCollection.classFor['NumericResponseTemplate'] =  class NumericResponseTemplate extends ResponseTemplate

  constructor: (@number, @initialValues = [""]) ->
    super()
    @name = "numeric"
    @fieldTypes = ("numeric" for val in @initialValues)


ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] =  class ConstructedResponseTemplate extends ResponseTemplate

  constructor: (@number, @initialValues = [""]) ->
    super()
    @name = "open"
    @fieldTypes = ("textarea" for val in @initialValues)


ResponseTemplateCollection.classFor['MultipleChoiceTemplate'] =  class MultipleChoiceTemplate extends ResponseTemplate

  constructor: (@number, @choices) ->
    super()
    @name = "multiple-choice"
    @fieldTypes = ["multiplechoice"]