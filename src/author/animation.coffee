{AnimationTool} = require '../runtime/animation-tool'

exports.Animation = class Animation

  constructor: ({@name, @yMin, @yMax, @markedCoordinates, @dataset}, @activity) ->
    @markedCoodinates ?= []

  # call only when generating runtime json--requires @activity.datasetsByName to be populated
  getXMin: ->
    dataset = @activity.datasetsByName[@dataset]
    dataset.data[0][0]

  # call only generating runtime json--requires @activity.datasetsByName to be populated
  getXMax: ->
    dataset = @activity.datasetsByName[@dataset]
    dataset.data[dataset.data.length-1][0]

  toAnimationTool: () ->
    new AnimationTool
      datasetName: @dataset
      staticImageYValues: @markedCoordinates
