# Modified slightly from Miles Johnson's snippet at http://www.milesj.me/resources/snippet/13

# Transform text into a URL slug: spaces turned into dashes, remove non alnum
# @param string text
# NOTE this appears to be slightly different (and nicer) than the slugification used in the Rails app

exports.slugify = (text) ->
  text = text.replace /[^-a-zA-Z0-9,&\s]+/ig, ''
  text = text.replace /-/gi, "_"
  text = text.replace /\s/gi, "-"
  text.toLowerCase()
