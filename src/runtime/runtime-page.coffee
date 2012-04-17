{slugify} = require '../slugify'
{ContextVar} = require './context-var'
exports.RuntimePage = class RuntimePage

  constructor: ->
    @steps = []
    @contextVars = []
    # need to be set
    @index = null

  setText: (@introText) ->
    @introText

  setName: (@name) ->
    @name

  setIndex: (@index) ->
    @index

  getUrl: ->
    "#{@activity.getUrl()}/page/#{@index}-#{slugify @name}"

  appendStep: ->
    @steps.push step = @activity.createStep()
    step.page  = this
    step.setIndex @steps.length
    step

  toHash: ->
    name:      @name
    url:       @getUrl()
    activity:  @activity.getUrl()
    index:     @index
    introText: @introText
    steps:     step.getUrl() for step in @steps
    firstStep: @steps[0]?.getUrl()
    contextVars: variable.toHash() for variable in @contextVars

  addContextVar: (contextVar) ->
    @contextVars.push(contextVar)

  addNewContextVar: (definition) -> 
    @addContextVar(new ContextVar(definition))
    
  addSlopeVars: (pointA,pointB,tolerance=2) ->
    @addNewContextVar(definition) for definition in @slopeVarDefs(pointA,pointB,tolerance)

  #TODO: protect against name-space collisions
  slopeVarDefs: (pointA, pointB,tolerance=2) ->
    [{
      "name": "start-y"     
      "value": ["coord", "y", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "start-y_str"    
      "value": ["toFixedString", ["get", "start-y"], tolerance]
      },{
     
      "name": "end-y"
      "value": ["coord", "y", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "end-y_str"
      "value": ["toFixedString", ["get", "end-y"], tolerance]
      },{
     
      "name": "change-y"
      "value": ["-", ["get", "end-y"], ["get", "start-y"]] 
      },{
     
      "name": "change-y_str"
      "value": ["toFixedString", ["get", "change-y"], tolerance]
      },{

      "name": "start-x"
      "value": ["coord", "x", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "start-x_str"
      "value": ["toFixedString", ["get", "start-x"], tolerance]
      },{
      
      "name": "end-x"
      "value": ["coord", "x", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
      
      "name": "end-x_str"
      "value": ["toFixedString", ["get", "end-x"], tolerance]
      },{
      
      "name": "change-x"
      "value": ["-", ["get", "end-x"], ["get", "start-x"]]
      },{
      
      "name": "change-x_str"
      "value": ["toFixedString", ["get", "change-x"], tolerance]
      },{

      "name": "slope"
      "value": ["/", ["get", "change-y"], ["get", "change-x"]]
      },{

      # TODO: we need to compute the 
      "name": "slope_str"
      "value": ["toFixedString", ["get", "slope"], tolerance] 
      }
    ]