exports.AnimationTool = class AnimationTool

  index: null
  panes: null
  hideGraph: false

  constructor: ({ @datasetName, @staticImageYValues }) ->

  toHash: ->
    name: "animation"
    setup:
      pane: if @panes.length == 1 then 'single' else if @index == 0 then 'top' else 'bottom'
      hideGraph: @hideGraph
      duration: 9000
      channelWidth: 70
      staticImages: [
        name: "finish"
        image: "finish.png"
        width: 70
        height: 10
        xOffset: 0
        yOffset: 5
        instances: ({y: y} for y in @staticImageYValues)
      ]
      backgroundImage: "road-dashed.png"
      animations: [
        data: @datasetName
        image: "carWhite2.png"
        width: 30
        height: 61
        xOffset: 40
        yOffset: 0
      ]
