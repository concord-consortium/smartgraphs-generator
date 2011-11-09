exports.Tag = class Tag

  constructor: ({@index}) ->
    @name = "tag-#{@index}"

  getUrl: ->
    "#{@activity.getUrl()}/tags/#{@name}"

  toHash: ->
    url:         @getUrl()
    activity:    @activity.getUrl()
    name:        @name
