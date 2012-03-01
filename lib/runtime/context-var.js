(function() {
  var ContextVar;

  exports.ContextVar = ContextVar = (function() {

    function ContextVar(_arg) {
      this.name = _arg.name, this.value = _arg.value;
    }

    ContextVar.prototype.toHash = function() {
      return {
        name: this.name,
        value: this.value
      };
    };

    return ContextVar;

  })();

}).call(this);
