{Step} = require './output.page'

exports.Page = class Page

  constructor: ->
    @steps = []

  toHash: () ->
    # go over the steps, give them unique IDs...
    hash

  appendStep: ->
    step = new Step(this)
    @steps.push step
    step
