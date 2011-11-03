exports.OutputUnit = class OutputUnit

  constructor: (@doc, @hash) ->
    hash.activity = null
    hash.url = "#{@doc.baseUrl()}/units/#{hash.pluralName}"

  url: ->
    @hash.url
