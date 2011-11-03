exports.OutputAxis = class OutputAxis

  constructor: (@doc, index, @hash) ->
    hash.url = "#{@doc.baseUrl()}/axes/#{index}"

  url: ->
    @hash.url
