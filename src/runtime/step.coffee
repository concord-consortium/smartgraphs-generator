exports.Step = class Step

  constructor: () ->
    @paneDefs = []
    # these need to be set later
    @page  = null
    @index = null

  addImagePane: ({ url, license, attribution, index }) ->
    @paneDefs[index] = { toHash: @getImagePaneHash, url, license, attribution }

  getImagePaneHash: ->
    type:    'image'
    path:    @url
    caption: "#{@license} #{@attribution}"

  addGraphPane: ({ title, datadefRef, xAxis, yAxis, index }) ->
    @paneDefs[index] = { toHash: @getGraphPaneHash, title, datadefRef, xAxis, yAxis }

  getGraphPaneHash: ->
    type:        'graph'
    title:       @title
    xAxis:       @xAxis.getUrl()
    yAxis:       @yAxis.getUrl()
    annotations: []
    data:        if @datadefRef? then [@datadefRef.datadef.name] else []

  addTablePane: ({ datadefRef, index }) ->
    @paneDefs[index] = { toHash: @getTablePaneHash, type: 'graph', datadefRef }

  getTablePaneHash:  ->
    type:         'table'
    data:         @datadefRef.datadef.name
    annotations:  []

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@page.getUrl()}/step/#{@index}"

  getPaneKey: (numPanes, index) ->
    if numPanes == 1 then "single" else if index == 0 then "top" else "bottom"

  toHash: ->
    panesHash = null
    if @paneDefs.length == 1
      panesHash =
        single: @paneDefs[0].toHash()
    else if @paneDefs.length == 2
      panesHash =
        top:    @paneDefs[0].toHash()
        bottom: @paneDefs[1].toHash()

    return {
      url:                    this.getUrl()
      activityPage:           @page.getUrl()
      paneConfig:             if  @paneDefs.length == 2 then 'split' else 'single',
      panes:                  panesHash
      isFinalStep:            true
      nextButtonShouldSubmit: true
    }
