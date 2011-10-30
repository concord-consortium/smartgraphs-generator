{OutputActivity} = require('./output-activity')
{OutputPage} = require('./output-page')
{OutputStep} = require('./output-step')

exports.OutputDocument = class OutputDocument
  constructor: ->
    @hash = 
      _id:                 "marias-run-generated-target.df6"
      _rev:                1
      data_format_version: 6
      activity:            null
      pages:               []
      steps:               []
      responseTemplates:   []
      axes:                []
      datadefs:            []
      tags:                []
      annotations:         []
      variables:           []
      units:               []

  createActivity: (hash) ->
    activity = new OutputActivity this, hash
    @hash.activity = activity.hash
    activity

  createPage: (hash) ->
    page = new OutputPage this, hash
    @hash.pages.push page.hash
    page
    
  createStep: (index, hash) -> 
    step = new OutputStep this, index, hash
    @hash.steps.push step.hash
    step
