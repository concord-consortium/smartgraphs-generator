exports.Step = class Step

  constructor: () ->
    @panesHash = null
    # these need to be set later
    @page  = null
    @index = null

  addImagePane: (url, license, attribution) ->
    @panesHash =
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
    panes:                  @panesHash
    isFinalStep:            true
    nextButtonShouldSubmit: true
