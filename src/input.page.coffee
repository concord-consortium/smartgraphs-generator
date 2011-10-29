exports.Page = class Page

  constructor: (@hash, @activity, @index) ->
    {@name, @text} = @hash
    @url = @activity.url + "/page/" + @index
    @stepUrl = @url + "/step/1"
    # TODO process @hash here

  # create an output.Page object and modify it appropriately
  convert: ->
    @outputPage = @outputActivity.appendPage(this)

  process: (output) ->
    output.pages.push
      name: @name
      url:  @url
      activity: @activity.url
      index: @index
      introText: @text
      steps: [
        @stepUrl
      ]
      firstStep: @stepUrl
      
    output.steps.push
      url: @stepUrl
      activityPage: @url
      paneConfig: 'single'
      panes: null
      isFinalStep: true
      nextButtonShouldSubmit: true
    
      