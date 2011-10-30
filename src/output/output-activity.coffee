###
  Output "Activity" object.

  This class knows how to construct a itself from an input.Activity object. It maintains a set of child objects that
  represent something close to the output "Smartgraphs runtime JSON" format and has a toHash method to generate that
  format. (However, this class will likely maintain model objects that aren't explicitly represented in the final
  output hash or in the Smartgraphs runtime; for example, having an output.Graph class makes sense, even though the
  output hash is 'denormalized' and doesn't have an explicit representation of a Graph)

  Mostly, this class and the classes of its contained child objects implement builder methods that the input.* objects
  know how to call.
###
{slugify} = require '../slugify'

exports.OutputActivity = class OutputActivity

  constructor: (@doc, @hash) ->
    hash.url = "/#{hash.owner}/#{slugify hash.title}"
    hash.pages = []
      
  url: ->
    @hash.url

  appendPage: (props) ->
    props.activity = this
    props.index = @hash.pages.length + 1
    outputPage = @doc.createPage props
    @hash.pages.push outputPage.url()
    outputPage

