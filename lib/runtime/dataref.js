(function() {
  var DataRef;

  exports.DataRef = DataRef = (function() {

    DataRef.serializeDataRefs = function(datarefRefs) {
      var dataref, datarefRef, datarefsByType, datarefsOfOneType, key, ret, type;
      ret = [];
      datarefsByType = {};
      for (key in datarefRefs) {
        datarefRef = datarefRefs[key];
        dataref = datarefRef.dataref;
        type = dataref.expressionType;
        datarefsByType[type] || (datarefsByType[type] = []);
        datarefsByType[type].push(dataref);
      }
      for (type in datarefsByType) {
        datarefsOfOneType = datarefsByType[type];
        ret.push({
          type: type,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = datarefsOfOneType.length; _i < _len; _i++) {
              dataref = datarefsOfOneType[_i];
              _results.push(dataref.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function DataRef(_arg) {
      this.datadefName = _arg.datadefName, this.expressionType = _arg.expressionType, this.expression = _arg.expression, this.expressionForm = _arg.expressionForm, this.angularFunction = _arg.angularFunction, this.xInterval = _arg.xInterval, this.params = _arg.params, this.index = _arg.index, this.name = _arg.name;
      if (!_arg.name) this.name = "dataref-" + this.index;
    }

    DataRef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datarefs/" + this.name;
    };

    DataRef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        datadefName: this.datadefName,
        expressionForm: this.expressionForm,
        expression: this.expressionType === 'CompositeEquation' ? this.expression : void 0,
        angularFunction: this.angularFunction,
        xInterval: this.xInterval,
        params: this.params
      };
    };

    return DataRef;

  })();

}).call(this);
