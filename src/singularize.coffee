# TODO put this, slugify, etc into utils.coffee?

exports.dumbSingularize = (str) ->
  # Super-dumb implementation for now. Doesn't handle the case that the singular ends with 's'.
  # But, really, this processing should be on the server side so authors can preview it!
  (str.match /(.*)s$/)?[1] || str
