exports.Step = class Step

  constructor: () ->
    @panes = null
    # these need to be set later
    @page  = null
    @index = null

  addImagePane: (url, license, attribution) ->
    @panes =
      single:
        type:    'image'
        path:    url
        caption: "#{license} #{attribution}"

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@page.getUrl()}/step/#{@index}"

  toHash: ->
    url:                    this.getUrl()
    activityPage:           @page.getUrl()
    paneConfig:             'single'
    panes:                  @panes
    isFinalStep:            true
    nextButtonShouldSubmit: true
