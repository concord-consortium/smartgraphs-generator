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
  sineRegExPattern = new RegExp('^y=(' + regExpNumberMultiplier + ')?sin\\((' + regExpNumberMultiplier + ')?x(' + regExpConstant + ')?\\)(' + regExpConstant + ')?$', 'i') #"y = A sin(kx + B)+C\" format."

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
    else if RegExp.$1 is "" or RegExp.$1 is "+" 
      params['slope'] =  1
    if RegExp.$2 is ""
      params['yIntercept'] = 0
    else
      params['yIntercept'] = parseFloat(RegExp.$2)

  else if sineRegExPattern.test(@expression)
    expressionData['type'] = 'SinusoidalEquation'
    expressionData['form'] = 'sine-cosine'
    expressionData['angularFunction'] = 'sine'
    if parseFloat(RegExp.$1) or parseFloat(RegExp.$1) is 0
      params['amplitude'] = parseFloat(RegExp.$1)
    else if RegExp.$1 is "-"
      params['amplitude'] = -1
    else if RegExp.$1 is "" or RegExp.$1 is "+"
      params['amplitude'] = 1

    if parseFloat(RegExp.$2) or parseFloat(RegExp.$2) is 0
      params['frequency'] = parseFloat(RegExp.$2)
    else if RegExp.$2 is "-"
      params['frequency'] = -1
    else if RegExp.$2 is "" or RegExp.$2 is "+"
      params['frequency'] = 1

    if parseFloat(RegExp.$3) or parseFloat(RegExp.$3) is 0
      params['phase'] = parseFloat(RegExp.$3)
    else if RegExp.$3 is "-"
      params['phase'] = 0
    else if RegExp.$3 is ""
      params['phase'] = 0

    if parseFloat(RegExp.$4) or parseFloat(RegExp.$4) is 0 
      params['centerAmplitude'] = parseFloat(RegExp.$4)
    else if RegExp.$4 is "-"
      params['centerAmplitude'] = 0
    else if RegExp.$4 is ""
      params['centerAmplitude'] = 0

  else if @expression is ""
    expressionData['type'] = 'not supported'

  else
    expressionData['type'] = 'CompositeEquation'

  expressionData['params'] = params

  expressionData