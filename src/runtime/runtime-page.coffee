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
    
  addSlopeVars: (pointA,pointB) ->
    @addNewContextVar(definition) for definition in @slopeVarDefs(pointA,pointB)

  #TODO: protect against name-space collisions
  slopeVarDefs: (pointA, pointB) ->
    [{
      "name": "start-y"     
      "value": ["coord", "y", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "start-y_str"    
      "value": ["toFixedString", ["get", "start-y"], 2]
      },{
     
      "name": "end-y"
      "value": ["coord", "y", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "end-y_str"
      "value": ["toFixedString", ["get", "end-y"], 2]
      },{
     
      "name": "change-y"
      "value": ["-", ["get", "end-y"], ["get", "start-y"]] 
      },{
     
      "name": "change-y_str"
      "value": ["toFixedString", ["get", "change-y"], 2]
      },{

      "name": "start-x"
      "value": ["coord", "x", ["listItem", 1, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
     
      "name": "start-x_str"
      "value": ["toFixedString", ["get", "start-x"], 2]
      },{
      
      "name": "end-x"
      "value": ["coord", "x", ["listItem", 2, ["slopeToolOrder", pointA.name, pointB.name]]]
      },{
      
      "name": "end-x_str"
      "value": ["toFixedString", ["get", "end-x"], 2]
      },{
      
      "name": "change-x"
      "value": ["-", ["get", "end-x"], ["get", "start-x"]]
      },{
      
      "name": "change-x_str"
      "value": ["toFixedString", ["get", "change-x"], 2]
      },{

      "name": "slope"
      "value": ["/", ["get", "change-y"], ["get", "change-x"]]
      },{

      "name": "slope_str"
      "value": ["toFixedString", ["get", "slope"], 2] 
      },{
      
      "name": "change-y-units"
      "value": ["pluralizeUnits", "/builtins/units/meters", ["get", "change-y"]]
      },{
      
      "name": "change-x-units"
      "value": ["pluralizeUnits", "/builtins/units/seconds", ["get", "change-x"]]
      },{
      
      "name": "slope-units"
      "value": ["pluralizeUnits", "/builtins/units/meters-per-second", ["get", "slope"]]
      }
    ]