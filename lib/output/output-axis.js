(function() {
  var OutputAxis;
  exports.OutputAxis = OutputAxis = (function() {
    function OutputAxis(doc, index, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.url = "" + (this.doc.baseUrl()) + "/axes/" + index;
    }
    OutputAxis.prototype.url = function() {
      return this.hash.url;
    };
    return OutputAxis;
  })();
}).call(this);
