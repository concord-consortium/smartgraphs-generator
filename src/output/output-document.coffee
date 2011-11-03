{slugify} = require '../slugify'
{OutputActivity} = require('./output-activity')
{OutputPage} = require('./output-page')
{OutputStep} = require('./output-step')
{OutputUnit} = require('./output-unit')
{OutputAxis} = require('./output-axis')
{OutputData} = require('./output-data')

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

  baseUrl: ->
    @activity.url()

  createActivity: (hash) ->
    @activity = activity = new OutputActivity this, hash
    @hash.activity = activity.hash
    @hash._id = "#{slugify activity.hash.title}.df6"
    activity

  createPage: (hash) ->
    page = new OutputPage this, hash
    @hash.pages.push page.hash
    page

  createStep: (index, hash) ->
    step = new OutputStep this, index, hash
    @hash.steps.push step.hash
    step

  createUnit: (hash) ->
    unit = new OutputUnit this, hash
    @hash.units.push unit.hash
    unit

  createAxis: (hash) ->
    index = @hash.axes.length + 1
    axis = new OutputAxis this, index, hash
    @hash.axes.push axis.hash
    @activity.hash.axes ||= []
    @activity.hash.axes.push axis.url()
    axis

  createData: (hash) ->
    unorderedDataPoints = (item for item in @hash.datadefs when item.type == "UnorderedDataPoints")[0]
    if !unorderedDataPoints
      @hash.datadefs.push unorderedDataPoints =
        type: "UnorderedDataPoints"
        records: []

    index = unorderedDataPoints.records.length + 1
    data = new OutputData this, "unordered", index, hash
    unorderedDataPoints.records.push data.hash
    data
