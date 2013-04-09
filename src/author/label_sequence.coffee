{AuthorPane}          = require './author-panes'

exports.LabelSequence = class LabelSequence
  constructor: ({
    @type,
    @text,
    @labelSetName,
    @numberOfLabels,
    @dataset,
    @page
    }) ->

    @numberOfLabels = 1  unless @numberOfLabels
    @anyLabel = if @dataset then true else false 
    @steps = []
    @runtimeStepsByName = {}

    for pane, i in @page.panes || []
      @graphPane = pane if pane instanceof AuthorPane.classFor["PredefinedGraphPane"]
      @tablePane = pane if pane instanceof AuthorPane.classFor["TablePane"]

  appendSteps: (runtimePage) ->
    runtimeActivity = runtimePage.activity
    step = runtimePage.appendStep()

    step.setBeforeText @text
    step.setSubmissibilityCriterion ["=", ["numberOfLabels", @labelSetName], @numberOfLabels],
    step.setSubmissibilityDependsOn ["annotation", @labelSetName]

    pane.addToStep(step) for pane in @page.panes

    if @dataset
      datadefRef = runtimeActivity.getDatadefRef(@dataset)
      step.addLabelTool { labelSetName: @labelSetName, index: @graphPane.index, datadefRef, markOnDataPoints: true, maxNoOfLabels : @numberOfLabels, allowCoordinatesChange : false }
    else
      step.addLabelTool { labelSetName: @labelSetName, index: @graphPane.index, markOnDataPoints: false, maxNoOfLabels : @numberOfLabels, allowCoordinatesChange : true }

    if @labelSetName
      @labelSetObject = runtimeActivity.createAndAppendAnnotation { type: 'LabelSet' , name: @labelSetName }
      step.addAnnotationToPane { annotation: @labelSetObject, index: @graphPane.index }