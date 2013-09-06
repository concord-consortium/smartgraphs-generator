{AnimationTool} = require '../runtime/animation-tool'

exports.Animation = class Animation

  constructor: ({@name, @yMin, @yMax, @markedCoordinates, @dataset}, @activity) ->
    @markedCoodinates ?= []
    @linkedAnimations ?= []

  # call only when generating runtime json--requires @activity.datasetsByName to be populated
  # DEPRECATED: this should come from the semantic JSON
  getXMin: ->
    console.warn "Please don't call Animation.getXMin; the value should be in the semantic JSON."
    dataset = @activity.datasetsByName[@dataset]
    dataset.data[0][0]

  # call only generating runtime json--requires @activity.datasetsByName to be populated
  # DEPRECATED: this should come from the semantic JSON
  getXMax: ->
    console.warn "Please don't call Animation.getXMax; the value should be in the semantic JSON."
    dataset = @activity.datasetsByName[@dataset]
    dataset.data[dataset.data.length-1][0]

  addLinkedAnimation: ({@pane, @datasets}) ->
    this.linkedAnimations.push({pane: @pane, datasets: @datasets})

  toAnimationTool: () ->
    new AnimationTool
      datasetName: @dataset
      staticImageYValues: @markedCoordinates
      linkedAnimations: @linkedAnimations
