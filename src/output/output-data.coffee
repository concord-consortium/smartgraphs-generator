exports.OutputData = class OutputData

  constructor: (@doc, prefix, index, @hash) ->
    hash.activity = @doc.baseUrl()
    hash.name = "#{prefix}-#{index}"
    hash.url = "#{@doc.baseUrl()}/datadefs/#{hash.name}"

  url: ->
    @hash.url
    
  name: ->
    @hash.name
