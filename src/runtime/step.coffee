exports.Step = class Step

  constructor: () ->
    @panesHash = null
    # these need to be set later
    @page  = null
    @index = null

  addImagePane: (url, license, attribution, numPanes, index) ->
    @panesHash ?= {}
    @panesHash[@getPaneKey numPanes, index] =
      type:    'image'
      path:    url
      caption: "#{license} #{attribution}"

  addGraphPane: ({ title, datadef, xAxis, yAxis, numPanes, index }) ->
    @panesHash ?= {}
    @panesHash[@getPaneKey numPanes, index] =
      type:        'graph'
      title:       title
      xAxis:       xAxis.getUrl()
      yAxis:       yAxis.getUrl()
      annotations: []
      data:        if datadef? then [datadef.name] else []

  addTablePane: (data, numPanes, index) ->
    @panesHash ?= {}
    @panesHash[@getPaneKey numPanes, index] =
      type:         'table'
      data:         data
      annotations:  []

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@page.getUrl()}/step/#{@index}"

  getPaneKey: (numPanes, index) ->
    if numPanes == 1 then "single" else if index == 0 then "top" else "bottom"

  findGraphData: ->
    for key, pane of @panesHash
      if pane.type == 'graph'
        return pane.data?[0]

  setTableData: (data) ->
    for key, pane of @panesHash
      if pane.type == 'table'
        pane.data = data

  toHash: ->
    url:                    this.getUrl()
    activityPage:           @page.getUrl()
    paneConfig:             if  @panesHash?.top? then 'split' else 'single',
    panes:                  @panesHash
    isFinalStep:            true
    nextButtonShouldSubmit: true
