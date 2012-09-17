expressionParser = require '../lib/author/expressionParser'

describe "Linear Expression Parsing", ->
  result = {}
  
  describe "for expression y= +2x + 5", ->
    beforeEach ->
      expression = "y=+2x + 5"
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

describe "Sinusoidal Expression Parsing", ->
  result = {}

  describe "for expression y=sin(x) + 5", ->
    beforeEach ->
      expression = "y= sin(x) + 5"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as 1", ->
      expect(result.params.amplitude).toEqual 1
    it "should parse the y-frequency value as 1", ->
      expect(result.params.frequency).toEqual 1
    it "should parse the phase value as 0", ->
      expect(result.params.phase).toEqual 0
    it "should parse the center amplitude value as 5", ->
      expect(result.params.centerAmplitude).toEqual 5

  describe "for expression y =  sin(23.26*x + 78.33) + 3266", ->
    beforeEach ->
      expression = "y =  sin(23.26*x + 78.33) + 3266"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as 1", ->
      expect(result.params.amplitude).toEqual 1
    it "should parse the frequency value as 23.26", ->
      expect(result.params.frequency).toEqual 23.26
    it "should parse the phase value as 78.33", ->
      expect(result.params.phase).toEqual 78.33
    it "should parse the center amplitude value as 3266", ->
      expect(result.params.centerAmplitude).toEqual 3266

  describe "for expression  y = 67  * Sin   (23.26  *   x)", ->
    beforeEach ->
      expression = "y = 67  * Sin   (23.26  *   x)"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as 67", ->
      expect(result.params.amplitude).toEqual 67
    it "should parse the frequency value as 23.26", ->
      expect(result.params.frequency).toEqual 23.26
    it "should parse the phase value as 0", ->
      expect(result.params.phase).toEqual 0
    it "should parse the center amplitude value as 0", ->
      expect(result.params.centerAmplitude).toEqual 0

  describe "for expression y =-sin(-x)", ->
    beforeEach ->
      expression = "y =-sin(-x)"
      result = expressionParser.expressionParser.parseExpression(expression)
    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as -1", ->
      expect(result.params.amplitude).toEqual -1
    it "should parse the frequency value as -1", ->
      expect(result.params.frequency).toEqual -1
    it "should parse the phase value as 0", ->
      expect(result.params.phase).toEqual 0
    it "should parse the center amplitude value as 0", ->
      expect(result.params.centerAmplitude).toEqual 0

  describe "for expression Y = -0.00243 *  Sin   (-23.26  *   x)  -0.223", ->
    beforeEach ->
      expression = "Y = -0.00243 *  Sin   (-23.26  *   x)  -0.223"
      result = expressionParser.expressionParser.parseExpression(expression)
    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as -0.00243", ->
      expect(result.params.amplitude).toEqual -0.00243
    it "should parse the frequency value as -23.26", ->
      expect(result.params.frequency).toEqual -23.26
    it "should parse the phase value as 0", ->
      expect(result.params.phase).toEqual 0
    it "should parse the center amplitude value as -0.223", ->
      expect(result.params.centerAmplitude).toEqual -0.223

  describe "for expression Y = -0.00 *  Sin   (-0.00  *   x)  -0.00", ->
    beforeEach ->
      expression = "Y = -0.00 *  Sin   (-0.00  *   x)  -0.00"
      result = expressionParser.expressionParser.parseExpression(expression)
    it "should give equation type as SinusoidalEquation", ->
      expect(result.type).toEqual "SinusoidalEquation"
    it "should be in the sine-cosine form", ->
      expect(result.form).toEqual "sine-cosine"
    it "should parse the amplitude as 0", ->
      expect(result.params.amplitude).toEqual 0
    it "should parse the frequency value as 0", ->
      expect(result.params.frequency).toEqual 0
    it "should parse the phase value as 0", ->
      expect(result.params.phase).toEqual 0
    it "should parse the center amplitude value as 0", ->
      expect(result.params.centerAmplitude).toEqual 0

describe "Composite Expression Parsing", ->
  result = {}

  describe "for expression y= 2*log(x) + 5", ->
    beforeEach ->
      expression = "y=2*log(x) + 5"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as CompositeEquation", ->
      expect(result.type).toEqual "CompositeEquation"

  describe "for expression y= log(x) + sin(x)", ->
    beforeEach ->
      expression = "y= log(x) + sin(x)"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as CompositeEquation", ->
      expect(result.type).toEqual "CompositeEquation"

  describe "for expression y= 7 * (x * x) + 4 * x - 10", ->
    beforeEach ->
      expression = "y= 7 * (x * x) + 4 * x - 10"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as CompositeEquation", ->
      expect(result.type).toEqual "CompositeEquation"

  describe "for expression y= (x - 1) / ( (x * x) + 12 )", ->
    beforeEach ->
      expression = "y= (x - 1) / ( (x * x) + 12 )"
      result = expressionParser.expressionParser.parseExpression(expression)

    it "should give equation type as CompositeEquation", ->
      expect(result.type).toEqual "CompositeEquation"