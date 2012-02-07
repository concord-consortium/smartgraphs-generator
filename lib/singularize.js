(function() {

  exports.dumbSingularize = function(str) {
    var _ref;
    return ((_ref = str.match(/(.*)s$/)) != null ? _ref[1] : void 0) || str;
  };

}).call(this);
