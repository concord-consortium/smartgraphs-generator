expressionParser = require '../lib/author/expressionParser'

describe "Expression Parsing", ->
  result = {}
  
  describe "for expression y=2x + 5", ->
    beforeEach ->
      expression = "y=2x + 5"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as 2", ->
      expect(result.params.slope).toEqual 2
    it "should parse the y-intercept value as 5", ->
      expect(result.params.yIntercept).toEqual 5

  describe "for expression y = -0.00056  * x - 1", ->
    beforeEach ->
      expression = "y =  -0.00056  * x - 1"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as  -0.00056 ", ->
      expect(result.params.slope).toEqual  -0.00056 
    it "should parse the y-intercept value as -1", ->
      expect(result.params.yIntercept).toEqual -1

  describe "for expression y = - 36.655", ->
    beforeEach ->
      expression = "y = - 36.655"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as 0", ->
      expect(result.params.slope).toEqual 0
    it "should parse the y-intercept value as -36.655", ->
      expect(result.params.yIntercept).toEqual -36.655

  describe "for expression y = -x", ->
    beforeEach ->
      expression = "y = -x"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as -1", ->
      expect(result.params.slope).toEqual -1
    it "should parse the y-intercept value as 0", ->
      expect(result.params.yIntercept).toEqual 0

  describe "for expression y = -0.0x", ->
    beforeEach ->
      expression = "y = -0.0x"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as 0", ->
      expect(result.params.slope).toEqual 0
    it "should parse the y-intercept value as 0", ->
      expect(result.params.yIntercept).toEqual 0

  describe "for expression Y=3142353543543.1263849124248932X +37462834248323.3432432432", ->
    beforeEach ->
      expression = "Y=3142353543543.1263849124248932X +37462834248323.3432432432"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as LinearEquation", ->
      expect(result.type).toEqual "LinearEquation"
    it "should be in the slope-intercept form", ->
      expect(result.form).toEqual "slope-intercept"
    it "should parse the slope value as 3142353543543.1263849124248932", ->
      expect(result.params.slope).toEqual 3142353543543.1263849124248932
    it "should parse the y-intercept value as 37462834248323.3432432432", ->
      expect(result.params.yIntercept).toEqual 37462834248323.3432432432

  describe "for expression y=-*x + 0", ->
    beforeEach ->
      expression = "y=-*x + 0"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as not supported", ->
      expect(result.type).toEqual "not supported"

  describe "for expression y= --9X ", ->
    beforeEach ->
      expression = "y=--9X"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as not supported", ->
      expect(result.type).toEqual "not supported"

  describe "for expression y=-.1*x ", ->
    beforeEach ->
      expression = "y=-.1*x"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as not supported", ->
      expect(result.type).toEqual "not supported"