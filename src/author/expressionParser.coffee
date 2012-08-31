@expressionParser =->

@expressionParser.parseExpression = (@expression)-> 
  expressionData = {}
  params = {}
  regExpSpace = /\s+/g
  @expression = @expression.replace(regExpSpace, "")
  regExpNum = "\\d+(?:\\.?\\d+)?"
  regExpNumberMultiplier = "(?:(?:[+-]?(?:" + regExpNum + ")))\\*?|(?:(?:[+-]))"
  regExpConstant = "[+-](?:" + regExpNum + ")"
  strResult = ""

  linearConstantRegExPattern = new RegExp('^y=([+-]?' + regExpNum + ')$', 'i') #for equation syntax like y = b
  linearRegExPattern = new RegExp('^y=(?:(' + regExpNumberMultiplier + ')?x)(' + regExpConstant + ')?$', 'i') #for equation syntax like y = mx + b

  if linearConstantRegExPattern.test(@expression)
    expressionData['type'] = 'LinearEquation'
    expressionData['form'] = 'slope-intercept'
    params['slope'] = 0
    params['yIntercept'] = parseFloat(RegExp.$1)
  else if linearRegExPattern.test(@expression)
    expressionData['type'] = 'LinearEquation'
    expressionData['form'] = 'slope-intercept'
    if parseFloat(RegExp.$1) or parseFloat(RegExp.$1) is 0 
      params['slope'] = parseFloat(RegExp.$1)
    else if RegExp.$1 is "-"
      params['slope'] = -1
    else if RegExp.$1 is ""
      params['slope'] =  1
    if RegExp.$2 is ""
      params['yIntercept'] = 0
    else
      params['yIntercept'] = parseFloat(RegExp.$2)
  else
    expressionData['type'] = 'not supported'

  expressionData['params'] = params

  expressionData