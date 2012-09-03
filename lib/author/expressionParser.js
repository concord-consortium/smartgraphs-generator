(function() {

  this.expressionParser = function() {};

  this.expressionParser.parseExpression = function(expression) {
    var expressionData, linearConstantRegExPattern, linearRegExPattern, params, regExpConstant, regExpNum, regExpNumberMultiplier, regExpSpace, sineRegExPattern, strResult;
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
    sineRegExPattern = new RegExp('^y=(' + regExpNumberMultiplier + ')?sin\\((' + regExpNumberMultiplier + ')?x(' + regExpConstant + ')?\\)(' + regExpConstant + ')?$', 'i');
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
    } else if (sineRegExPattern.test(this.expression)) {
      expressionData['type'] = 'SinusoidalEquation';
      expressionData['form'] = 'sine-cosine';
      expressionData['angularFunction'] = 'sine';
      if (parseFloat(RegExp.$1) || parseFloat(RegExp.$1) === 0) {
        params['amplitude'] = parseFloat(RegExp.$1);
      } else if (RegExp.$1 === "-") {
        params['amplitude'] = -1;
      } else if (RegExp.$1 === "" || RegExp.$1 === "+") {
        params['amplitude'] = 1;
      }
      if (parseFloat(RegExp.$2) || parseFloat(RegExp.$2) === 0) {
        params['frequency'] = parseFloat(RegExp.$2);
      } else if (RegExp.$2 === "-") {
        params['frequency'] = -1;
      } else if (RegExp.$2 === "" || RegExp.$2 === "+") {
        params['frequency'] = 1;
      }
      if (parseFloat(RegExp.$3) || parseFloat(RegExp.$3) === 0) {
        params['phase'] = parseFloat(RegExp.$3);
      } else if (RegExp.$3 === "-") {
        params['phase'] = 0;
      } else if (RegExp.$3 === "") {
        params['phase'] = 0;
      }
      if (parseFloat(RegExp.$4) || parseFloat(RegExp.$4) === 0) {
        params['centerAmplitude'] = parseFloat(RegExp.$4);
      } else if (RegExp.$4 === "-") {
        params['centerAmplitude'] = 0;
      } else if (RegExp.$4 === "") {
        params['centerAmplitude'] = 0;
      }
    } else {
      expressionData['type'] = 'not supported';
    }
    expressionData['params'] = params;
    return expressionData;
  };

}).call(this);
