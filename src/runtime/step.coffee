exports.Step = class Step

  constructor: (@sequence) ->
    @panes = []
    # these need to be set later
    @page  = null
    @index = null
    @beforeText = @sequence.text if @sequence?.type == "InstructionSequence"

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@page.getUrl()}/step/#{@index}"

  addImagePane: ({ url, license, attribution, index }) ->
    @panes[index] = {
      url, license, attribution,
      toHash: ->
        type:    'image'
        path:    @url
        caption: "#{@license} #{@attribution}"
    }

  addGraphPane: ({ title, datadefRef, xAxis, yAxis, index }) ->
    @panes[index] = {
      title, datadefRef, xAxis, yAxis,
      toHash: ->
        type:        'graph'
        title:       @title
        xAxis:       @xAxis.getUrl()
        yAxis:       @yAxis.getUrl()
        annotations: []
        data:        if @datadefRef? then [@datadefRef.datadef.name] else []
    }

  addTablePane: ({ datadefRef, index }) ->
    @panes[index] = {
      datadefRef,
      toHash: ->
        type:         'table'
        data:         @datadefRef.datadef.name
        annotations:  []
    }

  getPaneKey: (numPanes, index) ->
    if numPanes == 1 then "single" else if index == 0 then "top" else "bottom"

  toHash: ->

    panesHash = if @panes.length == 1 then {
      single: @panes[0].toHash()
    } else if @panes.length == 2 then {
      top:    @panes[0].toHash()
      bottom: @panes[1].toHash()
    }

    return {
      url:                    this.getUrl()
      activityPage:           @page.getUrl()
      paneConfig:             if  @panes.length == 2 then 'split' else 'single',
      panes:                  panesHash ? null
      isFinalStep:            true
      nextButtonShouldSubmit: true
      beforeText:             @beforeText
    }
