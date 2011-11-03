exports.OutputUnit = class OutputUnit

  constructor: (@doc, @hash) ->
    hash.activity = @doc.baseUrl()
    hash.url = "#{@doc.baseUrl()}/units/#{hash.pluralName}"

  url: ->
    @hash.url
