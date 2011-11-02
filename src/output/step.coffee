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

  url: ->
    "#{@page.url()}/step/#{@index}"

  toHash: ->
    url:                    this.url()
    activityPage:           @page.url()
    paneConfig:             'single'
    panes:                  @panes
    isFinalStep:            true
    nextButtonShouldSubmit: true
