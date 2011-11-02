{AuthorActivity} = require './author/author-activity'

exports.convert = (input) ->
  new AuthorActivity(input).toRuntimeActivity().toHash()