(function() {
  var OutputUnit;
  exports.OutputUnit = OutputUnit = (function() {
    function OutputUnit(doc, hash) {
      this.doc = doc;
      this.hash = hash;
      hash.activity = this.doc.baseUrl();
      hash.url = "" + (this.doc.baseUrl()) + "/units/" + hash.pluralName;
    }
    OutputUnit.prototype.url = function() {
      return this.hash.url;
    };
    return OutputUnit;
  })();
}).call(this);
