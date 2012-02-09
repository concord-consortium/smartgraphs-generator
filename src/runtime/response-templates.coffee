join = (name, vals) -> [name].concat(vals).map(escape).join '&'


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
    @name = 'numeric'
    @fieldTypes = ('numeric' for val in @initialValues)

  @getUniqueKey = (initialValues, choices) ->
    join 'numeric', initialValues


ResponseTemplateCollection.classFor['ConstructedResponseTemplate'] =  class ConstructedResponseTemplate extends ResponseTemplate

  constructor: (@number, @initialValues = [""]) ->
    super()
    @name = 'open'
    @fieldTypes = ('textarea' for val in @initialValues)

  @getUniqueKey = (initialValues, choices) ->
    join 'open', initialValues


ResponseTemplateCollection.classFor['MultipleChoiceTemplate'] =  class MultipleChoiceTemplate extends ResponseTemplate

  constructor: (@number, @initialValues, @choices) ->
    super()
    @name = "multiple-choice"
    @fieldTypes = ["multiplechoice"]

  # only share response templates between multiple choice steps if the *choices* are identical.
  @getUniqueKey = (initialValues, choices) ->
    join 'multiple-choice', choices
