exports.Step = class Step

  constructor: ->
    @panes = []
    @tools = {}
    @responseBranches = []
    @isFinalStep = true             # the default, overridden by makeNonFinal()
    @nextButtonShouldSubmit = true  # the default, overridden by makeNonFinal()
    # these need to be set later
    @page  = null
    @index = null

  setIndex: (@index) ->

  setBeforeText: (@beforeText) ->

  setSubmitButtonTitle: (@submitButtonTitle) ->

  setDefaultBranch: (@defaultBranch) ->

  setSubmissibilityCriterion: (@submissibilityCriterion) ->

  setSubmissibilityDependsOn: (@submissibilityDependsOn) ->

  setResponseTemplate: (@responseTemplate) ->

  getUrl: ->
    "#{@page.getUrl()}/step/#{@index}"

  addImagePane: ({ url, license, attribution, index }) ->
    @panes[index] = {
      url,
      license,
      attribution,
      toHash: ->
        type:    'image'
        path:    @url
        caption: "#{@license} #{@attribution}"
    }

  addGraphPane: ({ title, datadefRef, xAxis, yAxis, index }) ->
    @panes[index] = {
      title,
      datadefRef,
      xAxis,
      yAxis,
      annotations: [],
      toHash: ->
        type:        'graph'
        title:       @title
        xAxis:       @xAxis.getUrl()
        yAxis:       @yAxis.getUrl()
        annotations: annotation.name for annotation in @annotations
        data:        if @datadefRef? then [@datadefRef.datadef.name] else []
    }

  addTablePane: ({ datadefRef, index }) ->
    @panes[index] = {
      datadefRef,
      annotations: [],
      toHash: ->
        type:         'table'
        data:         @datadefRef.datadef.name
        annotations:  annotation.name for annotation in @annotations
    }

  addAnnotationToPane: ({ annotation, index }) ->
    @panes[index].annotations.push annotation

  addTaggingTool: ({ tag, datadefRef }) ->
    @tools['tagging'] = {
      tag,
      datadefRef,
      toHash: ->
        name: 'tagging'
        setup:
          tag:  @tag.name
          data: @datadefRef.datadef.name
    }

  addSensorTool: ({ index, datadefRef }) ->
    @tools['sensor'] = {
      index,
      panes: @panes,
      datadefRef,
      toHash: ->
        name: 'sensor'
        setup:
          controlsPane: if @panes.length == 1 then 'single' else if @index == 0 then 'top' else 'bottom'
          data:         @datadefRef.datadef.name
    }

  addPredictionTool: ({ index, datadefRef, annotation }) ->
    @tools['prediction'] = {
      index,
      panes: @panes,
      datadefRef,
      toHash: ->
        name: 'prediction'
        setup:
          pane: if @panes.length == 1 then 'single' else if @index == 0 then 'top' else 'bottom'
          uiBehavior: 'freehand'
          annotationName: annotation.name
    }

  appendResponseBranch: ({ criterion, step }) ->
    @responseBranches.push {
      criterion,
      step,
      toHash: ->
        criterion: @criterion
        step:      @step.getUrl()
    }

  makeNonFinal: ->
    @submitButtonTitle ?= "OK"     # the default, unless overridden
    @isFinalStep = false
    delete @nextButtonShouldSubmit

  toHash: ->

    panesHash = if @panes.length == 1 then {
      single: @panes[0].toHash()
    } else if @panes.length == 2 then {
      top:    @panes[0].toHash()
      bottom: @panes[1].toHash()
    }

    toolsHash = (tool.toHash() for key, tool of @tools)

    if @defaultBranch? or @responseBranches.length > 0
      this.makeNonFinal()

    return {
      url:                     this.getUrl()
      activityPage:            @page.getUrl()
      beforeText:              @beforeText
      paneConfig:              if  @panes.length == 2 then 'split' else 'single',
      panes:                   panesHash ? null
      tools:                   toolsHash if toolsHash.length > 0
      submitButtonTitle:       @submitButtonTitle
      defaultBranch:           @defaultBranch.getUrl() if @defaultBranch?
      responseTemplate:        @responseTemplate.getUrl() if @responseTemplate?
      submissibilityCriterion: @submissibilityCriterion ? undefined
      submissibilityDependsOn: @submissibilityDependsOn ? undefined
      responseBranches:        branch.toHash() for branch in @responseBranches if @responseBranches.length > 0
      isFinalStep:             @isFinalStep
      nextButtonShouldSubmit:  @nextButtonShouldSubmit
    }
