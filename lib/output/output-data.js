(function() {
  var OutputData;
  exports.OutputData = OutputData = (function() {
    function OutputData(doc, prefix, index, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activity = doc.activity.url();
      hash.name = "" + prefix + "-" + index;
      hash.url = "" + (this.doc.baseUrl()) + "/datadefs/" + hash.name;
    }
    OutputData.prototype.url = function() {
      return this.hash.url;
    };
    OutputData.prototype.name = function() {
      return this.hash.name;
    };
    return OutputData;
  })();
}).call(this);
