{dumbSingularize} = require '../singularize'

exports.AuthorUnit = class AuthorUnit

  constructor: (@hash, @activity) ->
    {@name, @abbreviation} = hash

  toRuntimeUnit: (runtimeActivity) ->
    runtimeUnit = runtimeActivity.createUnit()
    runtimeUnit.setProperties { name: dumbSingularize(@name), pluralName: @name, @abbreviation }

    runtimeUnit
