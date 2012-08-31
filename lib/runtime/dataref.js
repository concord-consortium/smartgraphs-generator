(function() {
  var DataRef;

  exports.DataRef = DataRef = (function() {

    DataRef.serializeDataRefs = function(dataRefRefs) {
      var dataRef, dataRefOfOneType, key, ret;
      ret = [];
      for (key in dataRefRefs) {
        dataRefOfOneType = dataRefRefs[key];
        ret.push({
          type: dataRefOfOneType[0].expressionType,
          records: (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = dataRefOfOneType.length; _i < _len; _i++) {
              dataRef = dataRefOfOneType[_i];
              _results.push(dataRef.toHash());
            }
            return _results;
          })()
        });
      }
      return ret;
    };

    function DataRef(_arg) {
      this.datadefname = _arg.datadefname, this.expressionType = _arg.expressionType, this.expressionForm = _arg.expressionForm, this.xInterval = _arg.xInterval, this.params = _arg.params, this.index = _arg.index;
      this.name = "dataref-" + this.index;
    }

    DataRef.prototype.getUrl = function() {
      return "" + (this.activity.getUrl()) + "/datarefs/" + this.name;
    };

    DataRef.prototype.toHash = function() {
      return {
        url: this.getUrl(),
        name: this.name,
        activity: this.activity.getUrl(),
        datadefname: this.datadefname,
        expressionForm: this.expressionForm,
        xInterval: this.xInterval,
        params: this.params
      };
    };

    return DataRef;

  })();

}).call(this);
