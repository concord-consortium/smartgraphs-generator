(function() {

  this.expressionParser = function() {};

  this.expressionParser.parseExpression = function(expression) {
    var expressionData, linearConstantRegExPattern, linearRegExPattern, params, regExpConstant, regExpNum, regExpNumberMultiplier, regExpSpace, strResult;
    this.expression = expression;
    expressionData = {};
    params = {};
    regExpSpace = /\s+/g;
    this.expression = this.expression.replace(regExpSpace, "");
    regExpNum = "\\d+(?:\\.?\\d+)?";
    regExpNumberMultiplier = "(?:(?:[+-]?(?:" + regExpNum + ")))\\*?|(?:(?:[+-]))";
    regExpConstant = "[+-](?:" + regExpNum + ")";
    strResult = "";
    linearConstantRegExPattern = new RegExp('^y=([+-]?' + regExpNum + ')$', 'i');
    linearRegExPattern = new RegExp('^y=(?:(' + regExpNumberMultiplier + ')?x)(' + regExpConstant + ')?$', 'i');
    if (linearConstantRegExPattern.test(this.expression)) {
      expressionData['type'] = 'LinearEquation';
      expressionData['form'] = 'slope-intercept';
      params['slope'] = 0;
      params['yIntercept'] = parseFloat(RegExp.$1);
    } else if (linearRegExPattern.test(this.expression)) {
      expressionData['type'] = 'LinearEquation';
      expressionData['form'] = 'slope-intercept';
      if (parseFloat(RegExp.$1) || parseFloat(RegExp.$1) === 0) {
        params['slope'] = parseFloat(RegExp.$1);
      } else if (RegExp.$1 === "-") {
        params['slope'] = -1;
      } else if (RegExp.$1 === "") {
        params['slope'] = 1;
      }
      if (RegExp.$2 === "") {
        params['yIntercept'] = 0;
      } else {
        params['yIntercept'] = parseFloat(RegExp.$2);
      }
    } else {
      expressionData['type'] = 'not supported';
    }
    expressionData['params'] = params;
    return expressionData;
  };

}).call(this);
